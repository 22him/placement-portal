import InterviewSession from '../models/InterviewSession.js';
import Company from '../models/Company.js';
import { asyncHandler, HttpError } from '../middleware/auth.js';
import { askAIJson } from '../services/ai.js';

const TYPES = ['technical', 'hr', 'company'];

export const generate = asyncHandler(async (req, res) => {
  const { type, role, company, count = 5 } = req.body;
  if (!TYPES.includes(type)) throw new HttpError(400, 'type must be technical, hr or company');
  if (!role?.trim()) throw new HttpError(400, 'Target role is required');
  if (type === 'company' && !company?.trim()) throw new HttpError(400, 'Company name is required for company-specific interviews');
  const n = Math.min(Math.max(parseInt(count, 10) || 5, 3), 10);

  let companyInfo = '';
  if (type === 'company') {
    const c = await Company.findOne({ name: new RegExp(`^${company.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    if (c) companyInfo = `Known company details: industry ${c.industry || 'n/a'}; required skills ${c.requiredSkills.join(', ') || 'n/a'}; roles ${c.roles.join(', ') || 'n/a'}.`;
  }

  const kind = {
    technical: 'technical interview questions covering core concepts, problem solving and practical experience',
    hr: 'HR / behavioural interview questions (motivation, teamwork, conflict, strengths/weaknesses, situational)',
    company: `interview questions typical for ${company} mixing technical and behavioural, referencing what the company is known for`,
  }[type];

  const ai = await askAIJson(
    'You are a senior interviewer preparing campus placement candidates (fresh graduates).',
    `Generate exactly ${n} ${kind} for a "${role}" role. ${companyInfo} Ask one clear question each, ordered easy to hard. Return JSON: {"questions": ["..."]}`
  );
  const questions = (ai.questions || []).filter((q) => typeof q === 'string' && q.trim()).slice(0, n);
  if (!questions.length) throw new HttpError(502, 'AI did not return any questions. Please try again.');

  const session = await InterviewSession.create({
    user: req.user._id,
    type,
    role: role.trim(),
    company: type === 'company' ? company.trim() : undefined,
    questions: questions.map((question) => ({ question })),
  });
  res.status(201).json({ session });
});

export const answer = asyncHandler(async (req, res) => {
  const { index, answer: text } = req.body;
  const session = await InterviewSession.findOne({ _id: req.params.id, user: req.user._id });
  if (!session) throw new HttpError(404, 'Session not found');
  if (session.status === 'completed') throw new HttpError(400, 'This session is already completed');
  const q = session.questions[index];
  if (!q) throw new HttpError(400, 'Invalid question index');
  if (!text || text.trim().length < 10) throw new HttpError(400, 'Please write a fuller answer (at least 10 characters)');
  if (text.length > 4000) throw new HttpError(400, 'Answer too long (max 4000 characters)');

  const ev = await askAIJson(
    'You are a strict but fair interviewer evaluating a fresh graduate. Score honestly; do not inflate.',
    `Role: ${session.role}${session.company ? `, Company: ${session.company}` : ''}, Interview type: ${session.type}
Question: ${q.question}
Candidate answer: ${text}

Return JSON: {"score": number 0-10, "feedback": string (2-4 sentences), "improvements": string[] (2-4 actionable), "idealPoints": string[] (key points a strong answer covers)}`
  );
  const score = Number(ev.score);
  if (Number.isNaN(score)) throw new HttpError(502, 'AI returned an invalid evaluation. Please resubmit.');

  q.answer = text.trim();
  q.score = Math.min(10, Math.max(0, score));
  q.feedback = ev.feedback;
  q.improvements = ev.improvements || [];
  q.idealPoints = ev.idealPoints || [];
  q.evaluated = true;
  await session.save();
  res.json({ session });
});

export const finish = asyncHandler(async (req, res) => {
  const session = await InterviewSession.findOne({ _id: req.params.id, user: req.user._id });
  if (!session) throw new HttpError(404, 'Session not found');
  const done = session.questions.filter((q) => q.evaluated);
  if (!done.length) throw new HttpError(400, 'Answer at least one question before finishing');
  session.overallScore = Math.round((done.reduce((a, q) => a + q.score, 0) / done.length) * 10);
  session.status = 'completed';
  await session.save();
  res.json({ session });
});

export const list = asyncHandler(async (req, res) => {
  const items = await InterviewSession.find({ user: req.user._id }).sort({ createdAt: -1 }).select('-questions.idealPoints');
  res.json({ items });
});

export const get = asyncHandler(async (req, res) => {
  const session = await InterviewSession.findOne({ _id: req.params.id, user: req.user._id });
  if (!session) throw new HttpError(404, 'Session not found');
  res.json({ session });
});

export const remove = asyncHandler(async (req, res) => {
  const s = await InterviewSession.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!s) throw new HttpError(404, 'Session not found');
  res.json({ message: 'Deleted' });
});
