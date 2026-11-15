import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import Resume from '../models/Resume.js';
import StudentProfile from '../models/StudentProfile.js';
import { asyncHandler, HttpError } from '../middleware/auth.js';
import { askAIJson } from '../services/ai.js';
import { ROLE_SKILLS, SOFT_SKILLS, ROLES } from '../utils/roleSkills.js';

const ACTION_VERBS = ['developed', 'built', 'designed', 'implemented', 'led', 'created', 'optimized', 'improved', 'managed', 'deployed', 'automated', 'analyzed', 'reduced', 'increased', 'collaborated', 'engineered', 'launched', 'integrated', 'architected', 'delivered'];

const has = (text, term) => new RegExp(`(^|[^a-z0-9+#])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9+#])`, 'i').test(text);

// Transparent, reproducible rubric. Every point can be traced to a rule shown to the user.
export function scoreResume(text, role) {
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean).length;
  const breakdown = [];

  const email = /[\w.+-]+@[\w-]+\.[\w.]+/.test(text);
  const phone = /(\+?\d[\d\s-]{8,}\d)/.test(text);
  const links = /(linkedin\.com|github\.com)/i.test(text);
  const contact = (email ? 4 : 0) + (phone ? 3 : 0) + (links ? 3 : 0);
  breakdown.push({ category: 'Contact details', points: contact, max: 10, note: `Email ${email ? '✓' : '✗'}, phone ${phone ? '✓' : '✗'}, LinkedIn/GitHub ${links ? '✓' : '✗'}` });

  const sections = { Education: /education|academic/, Experience: /experience|internship|work history/, Projects: /projects?/, Skills: /skills|technologies/, 'Achievements/Certifications': /achievements|certifications?|awards|extracurricular/ };
  const found = Object.entries(sections).filter(([, re]) => re.test(lower)).map(([k]) => k);
  const absent = Object.keys(sections).filter((k) => !found.includes(k));
  breakdown.push({ category: 'Standard sections', points: found.length * 4, max: 20, note: absent.length ? `Missing: ${absent.join(', ')}` : 'All key sections present' });

  const roleSkills = ROLE_SKILLS[role] || [];
  const detected = roleSkills.filter((s) => has(lower, s));
  const missing = roleSkills.filter((s) => !detected.includes(s));
  const skillPts = roleSkills.length ? Math.round((detected.length / roleSkills.length) * 30) : 0;
  breakdown.push({ category: `Skill match for ${role}`, points: skillPts, max: 30, note: `${detected.length} of ${roleSkills.length} expected skills found` });

  const quantified = (text.match(/\d+\s?(%|\+|x\b|k\b|users|customers|ms|seconds)/gi) || []).length;
  const quantPts = Math.min(15, quantified * 3);
  breakdown.push({ category: 'Quantified achievements', points: quantPts, max: 15, note: `${quantified} measurable results found (aim for 5+)` });

  const verbs = ACTION_VERBS.filter((v) => lower.includes(v));
  breakdown.push({ category: 'Action verbs', points: Math.min(10, Math.round(verbs.length * 1.25)), max: 10, note: `${verbs.length} distinct action verbs used (aim for 8+)` });

  let lenPts = 15;
  let lenNote = `${words} words, good length`;
  if (words < 150) { lenPts = 4; lenNote = `${words} words, too short`; }
  else if (words < 250) { lenPts = 9; lenNote = `${words} words, a bit short`; }
  else if (words > 1000) { lenPts = 6; lenNote = `${words} words, too long (aim for 1-2 pages)`; }
  else if (words > 800) { lenPts = 11; lenNote = `${words} words, slightly long`; }
  breakdown.push({ category: 'Length', points: lenPts, max: 15, note: lenNote });

  const score = breakdown.reduce((a, b) => a + b.points, 0);
  return { score, breakdown, detected, missing, soft: SOFT_SKILLS.filter((s) => has(lower, s)) };
}

export const analyzeResume = asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Please upload a PDF resume (field name: resume)');
  const targetRole = req.body.targetRole;
  if (!ROLE_SKILLS[targetRole]) throw new HttpError(400, `Choose a valid target role: ${ROLES.join(', ')}`);

  let text;
  try {
    text = (await pdfParse(req.file.buffer)).text.replace(/\s+\n/g, '\n').trim();
  } catch {
    throw new HttpError(400, 'Could not read this PDF. Make sure it is not corrupted or password protected.');
  }
  if (text.length < 100) throw new HttpError(400, 'No readable text found. Scanned/image-only PDFs are not supported; export a text-based PDF.');

  const result = scoreResume(text, targetRole);
  const resume = new Resume({
    user: req.user._id,
    fileName: req.file.originalname,
    targetRole,
    text,
    score: result.score,
    breakdown: result.breakdown,
    detectedSkills: result.detected,
    missingSkills: result.missing,
  });

  try {
    resume.aiAnalysis = await askAIJson(
      'You are an expert technical recruiter and ATS specialist reviewing a student resume for campus placements. Be specific and honest. Only reference content actually present in the resume.',
      `Target role: ${targetRole}
Rule-based score: ${result.score}/100. Skills expected for role but not found: ${result.missing.join(', ') || 'none'}.

Return JSON with keys: technicalSkills (string[] actually in resume), softSkills (string[] evidenced in resume), strengths (string[]), atsSuggestions (string[], concrete ATS-friendly formatting/keyword fixes), roleImprovements (string[], improvements for the ${targetRole} role), summary (string, 2-3 sentences).

RESUME TEXT:
${text.slice(0, 7000)}`
    );
  } catch (err) {
    resume.aiError = err.message;
  }

  await resume.save();

  // Merge detected skills into the student profile so recommendations improve.
  const found = resume.aiAnalysis?.technicalSkills?.length ? resume.aiAnalysis.technicalSkills : result.detected;
  const profile = await StudentProfile.findOne({ user: req.user._id });
  if (profile && found.length) {
    const set = new Set(profile.skills.map((s) => s.toLowerCase()));
    found.forEach((s) => !set.has(String(s).toLowerCase()) && profile.skills.push(s));
    await profile.save();
  }

  const out = resume.toObject();
  delete out.text;
  res.status(201).json({ resume: out });
});

export const listResumes = asyncHandler(async (req, res) => {
  const items = await Resume.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ items });
});

export const getResume = asyncHandler(async (req, res) => {
  const item = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!item) throw new HttpError(404, 'Resume not found');
  res.json({ resume: item });
});

export const deleteResume = asyncHandler(async (req, res) => {
  const item = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!item) throw new HttpError(404, 'Resume not found');
  res.json({ message: 'Deleted' });
});

export const roles = (req, res) => res.json({ roles: ROLES });
