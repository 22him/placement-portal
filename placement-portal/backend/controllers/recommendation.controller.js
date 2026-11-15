import Company from '../models/Company.js';
import StudentProfile from '../models/StudentProfile.js';
import Resume from '../models/Resume.js';
import { asyncHandler } from '../middleware/auth.js';
import { evaluateMatch } from '../utils/match.js';
import { askAIJson, aiEnabled } from '../services/ai.js';

// Match % is computed by a fixed, documented formula (skills 50, CGPA 20, branch 15, backlogs 15).
// With ?ai=1 the top matches also get an AI-written explanation grounded in the computed facts.
export const companyRecommendations = asyncHandler(async (req, res) => {
  const [profile, companies, resume] = await Promise.all([
    StudentProfile.findOne({ user: req.user._id }),
    Company.find(),
    Resume.findOne({ user: req.user._id }).sort({ createdAt: -1 }),
  ]);
  const extra = resume?.detectedSkills || [];
  const items = companies
    .map((c) => ({ company: c, ...evaluateMatch(profile, c, extra) }))
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .map((r) => ({ ...r, company: r.company.toObject() }));

  let aiError = null;
  if (req.query.ai === '1') {
    if (!aiEnabled()) aiError = 'AI is not configured on the server.';
    else {
      try {
        const top = items.slice(0, 3);
        const ai = await askAIJson(
          'You are a placement advisor. Explain match results to a student in a friendly, specific way using only the facts provided.',
          `Student: branch ${profile?.branch}, CGPA ${profile?.cgpa}, backlogs ${profile?.backlogs}, skills ${(profile?.skills || []).concat(extra).join(', ')}.
Matches: ${JSON.stringify(top.map((t) => ({ company: t.company.name, matchPercent: t.matchPercent, matchedSkills: t.matchedSkills, missingSkills: t.missingSkills, missingEligibility: t.missingEligibility })))}
Return JSON: {"explanations": [{"company": string, "why": string (2-3 sentences), "nextSteps": string[] (2-3 items to close gaps)}]}`
        );
        (ai.explanations || []).forEach((e) => {
          const hit = top.find((t) => t.company.name === e.company);
          if (hit) hit.aiExplanation = { why: e.why, nextSteps: e.nextSteps };
        });
      } catch (e) {
        aiError = e.message;
      }
    }
  }
  res.json({ items, aiError });
});
