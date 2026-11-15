import LearningRoadmap from '../models/LearningRoadmap.js';
import StudentProfile from '../models/StudentProfile.js';
import { asyncHandler, HttpError } from '../middleware/auth.js';
import { askAIJson } from '../services/ai.js';
import { studentStats } from '../utils/stats.js';
import { ROLE_SKILLS, ROLES } from '../utils/roleSkills.js';

function withProgress(r) {
  const o = r.toObject();
  const tasks = o.weeks.flatMap((w) => w.tasks);
  const done = tasks.filter((t) => t.done);
  const byDay = {};
  done.forEach((t) => {
    const d = new Date(t.doneOn).toISOString().slice(0, 10);
    byDay[d] = (byDay[d] || 0) + 1;
  });
  o.progress = { total: tasks.length, done: done.length, percent: tasks.length ? Math.round((done.length / tasks.length) * 100) : 0, byDay };
  return o;
}

export const generate = asyncHandler(async (req, res) => {
  const { targetRole, hoursPerWeek = 10, weeks = 4 } = req.body;
  if (!ROLE_SKILLS[targetRole]) throw new HttpError(400, `Choose a valid target role: ${ROLES.join(', ')}`);
  const hrs = Math.min(Math.max(parseInt(hoursPerWeek, 10) || 10, 2), 60);
  const nWeeks = Math.min(Math.max(parseInt(weeks, 10) || 4, 1), 12);

  const [stats, profile, previous] = await Promise.all([
    studentStats(req.user._id),
    StudentProfile.findOne({ user: req.user._id }),
    LearningRoadmap.findOne({ user: req.user._id, active: true }),
  ]);
  const completed = previous ? previous.weeks.flatMap((w) => w.tasks).filter((t) => t.done).map((t) => t.title) : [];
  const skillGap = ROLE_SKILLS[targetRole].filter((s) => !(profile?.skills || []).map((x) => x.toLowerCase()).includes(s));

  const ai = await askAIJson(
    'You are a placement mentor creating a realistic personalised study plan for a college student. Base it strictly on the performance data given.',
    `Target role: ${targetRole}. Available time: ${hrs} hours/week for ${nWeeks} weeks.
Performance data (real, from the platform):
- Coding: ${stats.coding.solved}/${stats.coding.total} solved; by topic ${JSON.stringify(stats.coding.byTopic)}
- Aptitude: avg ${stats.aptitude.average}% over ${stats.aptitude.testsTaken} tests; topics ${JSON.stringify(stats.aptitude.topics)}
- Mock interviews: avg ${stats.interview.average}% over ${stats.interview.sessions} sessions
- Resume score: ${stats.resume?.score ?? 'no resume analysed'}; missing resume skills: ${(stats.resume?.missingSkills || []).join(', ') || 'n/a'}
- Skills on profile: ${(profile?.skills || []).join(', ') || 'none'}; skill gap for role: ${skillGap.join(', ') || 'none'}
- Tasks already completed (do not repeat): ${completed.join('; ') || 'none'}

Return JSON: {"weakAreas": string[], "weeks": [{"week": 1, "focus": string, "tasks": [{"title": string, "resource": string (a well-known free resource name or site, e.g. "NeetCode roadmap", "freeCodeCamp", "GeeksforGeeks"; no invented URLs), "day": "Mon".."Sun"}]}]}. Exactly ${nWeeks} weeks, 5-8 tasks per week, harder topics later.`,
    { maxTokens: 4000 }
  );
  if (!Array.isArray(ai.weeks) || !ai.weeks.length) throw new HttpError(502, 'AI did not return a plan. Please try again.');

  await LearningRoadmap.updateMany({ user: req.user._id, active: true }, { active: false });
  const roadmap = await LearningRoadmap.create({
    user: req.user._id,
    targetRole,
    hoursPerWeek: hrs,
    weakAreas: ai.weakAreas || [],
    weeks: ai.weeks.map((w, i) => ({
      week: w.week || i + 1,
      focus: w.focus,
      tasks: (w.tasks || []).map((t) => ({ title: t.title, resource: t.resource, day: t.day })),
    })),
  });
  res.status(201).json({ roadmap: withProgress(roadmap) });
});

export const current = asyncHandler(async (req, res) => {
  const r = await LearningRoadmap.findOne({ user: req.user._id, active: true });
  res.json({ roadmap: r ? withProgress(r) : null, roles: ROLES });
});

export const toggleTask = asyncHandler(async (req, res) => {
  const { week, task, done } = req.body;
  const r = await LearningRoadmap.findOne({ _id: req.params.id, user: req.user._id });
  if (!r) throw new HttpError(404, 'Roadmap not found');
  const t = r.weeks[week]?.tasks[task];
  if (!t) throw new HttpError(400, 'Invalid task');
  t.done = Boolean(done);
  t.doneOn = t.done ? new Date() : undefined;
  await r.save();
  res.json({ roadmap: withProgress(r) });
});

export const remove = asyncHandler(async (req, res) => {
  const r = await LearningRoadmap.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!r) throw new HttpError(404, 'Roadmap not found');
  res.json({ message: 'Deleted' });
});
