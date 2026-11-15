import CodingQuestion from '../models/CodingQuestion.js';
import CodingSubmission from '../models/CodingSubmission.js';
import { asyncHandler, HttpError } from '../middleware/auth.js';
import { studentStats } from '../utils/stats.js';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const list = asyncHandler(async (req, res) => {
  const { difficulty, topic, search, status } = req.query;
  const q = {};
  if (difficulty) q.difficulty = difficulty;
  if (topic) q.topic = topic;
  if (search) q.title = new RegExp(esc(search), 'i');
  const [questions, subs, topics] = await Promise.all([
    CodingQuestion.find(q).sort({ topic: 1, difficulty: 1, title: 1 }),
    CodingSubmission.find({ user: req.user._id }),
    CodingQuestion.distinct('topic'),
  ]);
  const map = new Map(subs.map((s) => [String(s.question), s.status]));
  let items = questions.map((x) => ({ ...x.toObject(), status: map.get(String(x._id)) || 'todo' }));
  if (status) items = items.filter((i) => i.status === status);
  res.json({ items, topics: topics.sort() });
});

export const submit = asyncHandler(async (req, res) => {
  const { status, language, code, notes } = req.body;
  if (!['attempted', 'solved'].includes(status)) throw new HttpError(400, 'status must be attempted or solved');
  const question = await CodingQuestion.findById(req.params.id);
  if (!question) throw new HttpError(404, 'Question not found');
  const update = { status, language, code, notes };
  if (status === 'solved') update.solvedAt = new Date();
  const sub = await CodingSubmission.findOneAndUpdate({ user: req.user._id, question: question._id }, update, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
  res.json({ submission: sub });
});

export const unmark = asyncHandler(async (req, res) => {
  await CodingSubmission.findOneAndDelete({ user: req.user._id, question: req.params.id });
  res.json({ message: 'Progress cleared' });
});

export const progress = asyncHandler(async (req, res) => {
  const stats = await studentStats(req.user._id);
  res.json({ coding: stats.coding, weakTopics: stats.weakAreas.coding });
});

export const recommendations = asyncHandler(async (req, res) => {
  const stats = await studentStats(req.user._id);
  const done = new Set((await CodingSubmission.find({ user: req.user._id, status: 'solved' }).select('question')).map((s) => String(s.question)));
  const weak = stats.weakAreas.coding;
  const all = await CodingQuestion.find();
  const rank = { Easy: 0, Medium: 1, Hard: 2 };
  const pool = all.filter((q) => !done.has(String(q._id)));
  const inWeak = pool.filter((q) => weak.includes(q.topic)).sort((a, b) => rank[a.difficulty] - rank[b.difficulty]);
  const rest = pool.filter((q) => !weak.includes(q.topic)).sort((a, b) => rank[a.difficulty] - rank[b.difficulty]);
  const items = [...inWeak, ...rest].slice(0, 6).map((q) => ({ ...q.toObject(), reason: weak.includes(q.topic) ? `Weak topic: ${q.topic}` : 'Next unsolved question' }));
  res.json({ weakTopics: weak, items });
});
