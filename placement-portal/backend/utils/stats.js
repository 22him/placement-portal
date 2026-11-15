import CodingQuestion from '../models/CodingQuestion.js';
import CodingSubmission from '../models/CodingSubmission.js';
import TestResult from '../models/TestResult.js';
import InterviewSession from '../models/InterviewSession.js';
import Resume from '../models/Resume.js';

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
const round = (n) => Math.round(n);

// Everything computed from real stored data. Preparation progress formula:
// coding solved% * 0.30 + aptitude avg% * 0.30 + interview avg% * 0.20 + latest resume score * 0.20
export async function studentStats(userId) {
  const [topicTotals, diffTotals, solved, results, interviews, resume] = await Promise.all([
    CodingQuestion.aggregate([{ $group: { _id: '$topic', total: { $sum: 1 } } }]),
    CodingQuestion.aggregate([{ $group: { _id: '$difficulty', total: { $sum: 1 } } }]),
    CodingSubmission.find({ user: userId, status: 'solved' }).populate('question', 'topic difficulty'),
    TestResult.find({ user: userId }).sort({ createdAt: 1 }),
    InterviewSession.find({ user: userId, status: 'completed' }).sort({ createdAt: 1 }),
    Resume.findOne({ user: userId }).sort({ createdAt: -1 }),
  ]);

  const totalQuestions = topicTotals.reduce((a, t) => a + t.total, 0);
  const solvedValid = solved.filter((s) => s.question);
  const solvedByTopic = {};
  const solvedByDiff = { Easy: 0, Medium: 0, Hard: 0 };
  solvedValid.forEach((s) => {
    solvedByTopic[s.question.topic] = (solvedByTopic[s.question.topic] || 0) + 1;
    solvedByDiff[s.question.difficulty] += 1;
  });
  const codingTopics = topicTotals
    .map((t) => ({ topic: t._id, total: t.total, solved: solvedByTopic[t._id] || 0 }))
    .map((t) => ({ ...t, percent: round((t.solved / t.total) * 100) }))
    .sort((a, b) => a.topic.localeCompare(b.topic));
  const codingPercent = totalQuestions ? round((solvedValid.length / totalQuestions) * 100) : 0;

  const aptByCategory = {};
  const aptTopics = {};
  results.forEach((r) => {
    (aptByCategory[r.category] ||= []).push(r.percent);
    (r.topicBreakdown || []).forEach((t) => {
      const a = (aptTopics[t.topic] ||= { correct: 0, total: 0 });
      a.correct += t.correct;
      a.total += t.total;
    });
  });
  const aptitudeAvg = round(avg(results.map((r) => r.percent)));
  const aptitudeTopics = Object.entries(aptTopics).map(([topic, v]) => ({
    topic,
    correct: v.correct,
    total: v.total,
    percent: round((v.correct / v.total) * 100),
  }));

  const interviewAvg = round(avg(interviews.map((i) => i.overallScore || 0)));
  const resumeScore = resume?.score || 0;

  const preparationProgress = round(codingPercent * 0.3 + aptitudeAvg * 0.3 + interviewAvg * 0.2 + resumeScore * 0.2);

  const weakCoding = codingTopics.filter((t) => t.percent < 50).sort((a, b) => a.percent - b.percent).map((t) => t.topic);
  const weakAptitude = aptitudeTopics.filter((t) => t.percent < 60).sort((a, b) => a.percent - b.percent).map((t) => t.topic);

  return {
    coding: { solved: solvedValid.length, total: totalQuestions, percent: codingPercent, byDifficulty: solvedByDiff, byTopic: codingTopics },
    aptitude: {
      testsTaken: results.length,
      average: aptitudeAvg,
      byCategory: Object.entries(aptByCategory).map(([category, v]) => ({ category, average: round(avg(v)), attempts: v.length })),
      topics: aptitudeTopics,
      history: results.map((r) => ({ date: r.createdAt, percent: r.percent, category: r.category })),
    },
    interview: {
      sessions: interviews.length,
      average: interviewAvg,
      history: interviews.map((i) => ({ date: i.createdAt, score: i.overallScore, type: i.type })),
    },
    resume: resume
      ? { score: resume.score, targetRole: resume.targetRole, missingSkills: resume.missingSkills, date: resume.createdAt }
      : null,
    preparationProgress,
    weakAreas: { coding: weakCoding, aptitude: weakAptitude },
  };
}
