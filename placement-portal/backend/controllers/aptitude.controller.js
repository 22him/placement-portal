import AptitudeTest from '../models/AptitudeTest.js';
import TestResult from '../models/TestResult.js';
import { asyncHandler, HttpError } from '../middleware/auth.js';
import { askAI, aiEnabled } from '../services/ai.js';
import { studentStats } from '../utils/stats.js';

export const listTests = asyncHandler(async (req, res) => {
  const { category, type, search } = req.query;
  const q = {};
  if (category) q.category = category;
  if (type) q.type = type;
  if (search) q.title = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const tests = await AptitudeTest.find(q).select('-questions.correctIndex -questions.explanation').sort({ category: 1, title: 1 });
  const results = await TestResult.find({ user: req.user._id });
  const best = {};
  results.forEach((r) => {
    const id = String(r.test);
    best[id] = Math.max(best[id] || 0, r.percent);
  });
  res.json({
    items: tests.map((t) => ({
      _id: t._id, title: t.title, category: t.category, topic: t.topic, type: t.type,
      durationMins: t.durationMins, questionCount: t.questions.length, bestPercent: best[String(t._id)] ?? null,
    })),
  });
});

export const getTest = asyncHandler(async (req, res) => {
  const t = await AptitudeTest.findById(req.params.id).select('-questions.correctIndex -questions.explanation');
  if (!t) throw new HttpError(404, 'Test not found');
  res.json({ test: t });
});

export const submitTest = asyncHandler(async (req, res) => {
  const test = await AptitudeTest.findById(req.params.id);
  if (!test) throw new HttpError(404, 'Test not found');
  const { answers, timeTakenSecs = 0 } = req.body;
  if (!Array.isArray(answers) || answers.length !== test.questions.length) throw new HttpError(400, 'Answers must match the number of questions (use -1 for skipped)');

  const topics = {};
  let score = 0;
  const review = test.questions.map((q, i) => {
    const chosen = Number.isInteger(answers[i]) ? answers[i] : -1;
    const correct = chosen === q.correctIndex;
    if (correct) score += 1;
    const key = q.topic || test.topic || test.category;
    const t = (topics[key] ||= { topic: key, correct: 0, total: 0 });
    t.total += 1;
    if (correct) t.correct += 1;
    return { text: q.text, options: q.options, chosen, correctIndex: q.correctIndex, correct, explanation: q.explanation };
  });

  const result = await TestResult.create({
    user: req.user._id,
    test: test._id,
    category: test.category,
    answers: answers.map((a) => (Number.isInteger(a) ? a : -1)),
    score,
    total: test.questions.length,
    percent: Math.round((score / test.questions.length) * 100),
    timeTakenSecs: Math.max(0, Number(timeTakenSecs) || 0),
    topicBreakdown: Object.values(topics),
  });
  res.status(201).json({ result, review, testTitle: test.title });
});

export const myResults = asyncHandler(async (req, res) => {
  const items = await TestResult.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('test', 'title type category');
  res.json({ items });
});

export const recommendations = asyncHandler(async (req, res) => {
  const stats = await studentStats(req.user._id);
  const weak = stats.weakAreas.aptitude;
  const tests = await AptitudeTest.find().select('title category topic type durationMins questions.topic');
  const taken = new Set((await TestResult.find({ user: req.user._id }).select('test')).map((r) => String(r.test)));
  const score = (t) => {
    const topics = new Set([t.topic, ...t.questions.map((q) => q.topic)].filter(Boolean));
    return weak.filter((w) => topics.has(w)).length * 2 + (taken.has(String(t._id)) ? 0 : 1);
  };
  const suggested = tests
    .map((t) => ({ _id: t._id, title: t.title, category: t.category, type: t.type, durationMins: t.durationMins, relevance: score(t) }))
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5);

  let aiAdvice = null;
  let aiError = null;
  if (req.query.ai === '1') {
    if (!stats.aptitude.testsTaken) aiError = 'Take at least one aptitude test to get AI advice.';
    else if (!aiEnabled()) aiError = 'AI is not configured on the server.';
    else {
      try {
        aiAdvice = await askAI(
          'You are an aptitude coach for campus placements. Be concise (max 150 words), practical and specific.',
          `Student aptitude data (real results): average ${stats.aptitude.average}%. By category: ${JSON.stringify(stats.aptitude.byCategory)}. Topic accuracy: ${JSON.stringify(stats.aptitude.topics)}. Give a short study plan focused on weakest topics.`,
          { maxTokens: 600 }
        );
      } catch (e) {
        aiError = e.message;
      }
    }
  }
  res.json({ weakTopics: weak, suggested, aiAdvice, aiError });
});
