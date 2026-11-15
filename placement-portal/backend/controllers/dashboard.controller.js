import PlacementDrive from '../models/PlacementDrive.js';
import JobApplication from '../models/JobApplication.js';
import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';
import Resume from '../models/Resume.js';
import TestResult from '../models/TestResult.js';
import CodingSubmission from '../models/CodingSubmission.js';
import InterviewSession from '../models/InterviewSession.js';
import { asyncHandler } from '../middleware/auth.js';
import { studentStats } from '../utils/stats.js';
import { evaluateMatch } from '../utils/match.js';

export const studentDashboard = asyncHandler(async (req, res) => {
  const stats = await studentStats(req.user._id);
  const profile = await StudentProfile.findOne({ user: req.user._id });
  const drives = await PlacementDrive.find({ status: 'upcoming', deadline: { $gte: new Date() } }).populate('company', 'name').sort({ driveDate: 1 }).limit(5);
  const apps = await JobApplication.find({ student: req.user._id });
  const appMap = new Map(apps.map((a) => [String(a.drive), a.status]));

  // Rule-based suggestions derived from the numbers above (not AI-generated).
  const activities = [];
  if (!stats.resume) activities.push({ text: 'Upload your resume to get a score and skill-gap analysis', to: '/student/resume' });
  else if (stats.resume.score < 70) activities.push({ text: `Improve your resume (current score ${stats.resume.score}/100)`, to: '/student/resume' });
  stats.weakAreas.coding.slice(0, 2).forEach((t) => activities.push({ text: `Practice ${t} coding questions`, to: '/student/coding' }));
  stats.weakAreas.aptitude.slice(0, 2).forEach((t) => activities.push({ text: `Revise aptitude topic: ${t}`, to: '/student/aptitude' }));
  if (!stats.aptitude.testsTaken) activities.push({ text: 'Take your first aptitude test', to: '/student/aptitude' });
  if (!stats.interview.sessions) activities.push({ text: 'Complete a mock interview', to: '/student/interview' });
  if (!stats.coding.solved) activities.push({ text: 'Solve your first coding question', to: '/student/coding' });

  res.json({
    stats,
    profileComplete: Boolean(profile?.branch && profile?.cgpa && profile?.skills?.length),
    upcomingDrives: drives.map((d) => ({
      ...d.toObject(),
      applicationStatus: appMap.get(String(d._id)) || null,
      eligible: evaluateMatch(profile, d).eligible,
    })),
    activities: activities.slice(0, 6),
    applications: { total: apps.length, shortlisted: apps.filter((a) => a.status === 'shortlisted').length, selected: apps.filter((a) => a.status === 'selected').length },
  });
});

export const studentAnalytics = asyncHandler(async (req, res) => {
  const stats = await studentStats(req.user._id);
  const resumes = await Resume.find({ user: req.user._id }).sort({ createdAt: 1 }).select('score createdAt targetRole');
  res.json({ stats, resumeHistory: resumes.map((r) => ({ date: r.createdAt, score: r.score, targetRole: r.targetRole })) });
});

export const adminAnalytics = asyncHandler(async (req, res) => {
  const [students, placedCount, drives, apps, resumes, results, subs, interviews] = await Promise.all([
    StudentProfile.find(),
    StudentProfile.countDocuments({ placed: true }),
    PlacementDrive.find().populate('company', 'name'),
    JobApplication.find().populate({ path: 'drive', populate: { path: 'company', select: 'name' } }),
    Resume.aggregate([{ $sort: { createdAt: -1 } }, { $group: { _id: '$user', score: { $first: '$score' } } }]),
    TestResult.aggregate([{ $group: { _id: '$category', avg: { $avg: '$percent' }, attempts: { $sum: 1 } } }]),
    CodingSubmission.aggregate([{ $match: { status: 'solved' } }, { $group: { _id: '$user', solved: { $sum: 1 } } }]),
    InterviewSession.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, avg: { $avg: '$overallScore' }, count: { $sum: 1 } } }]),
  ]);

  const byCompany = {};
  const statusCount = { applied: 0, shortlisted: 0, selected: 0, rejected: 0 };
  apps.forEach((a) => {
    const name = a.drive?.company?.name || 'Unknown';
    const c = (byCompany[name] ||= { company: name, applications: 0, selected: 0 });
    c.applications += 1;
    if (a.status === 'selected') c.selected += 1;
    statusCount[a.status] += 1;
  });

  const bands = [['0-39', 0, 39], ['40-59', 40, 59], ['60-79', 60, 79], ['80-100', 80, 100]];
  const resumeBands = bands.map(([label, lo, hi]) => ({ band: label, students: resumes.filter((r) => r.score >= lo && r.score <= hi).length }));

  const solvedBands = [['0', 0, 0], ['1-5', 1, 5], ['6-10', 6, 10], ['11+', 11, 9999]];
  const solvedMap = new Map(subs.map((s) => [String(s._id), s.solved]));
  const codingBands = solvedBands.map(([label, lo, hi]) => ({
    band: label,
    students: students.filter((s) => { const n = solvedMap.get(String(s.user)) || 0; return n >= lo && n <= hi; }).length,
  }));

  const branchMap = {};
  students.forEach((s) => {
    const b = (branchMap[s.branch || 'Unknown'] ||= { branch: s.branch || 'Unknown', total: 0, placed: 0 });
    b.total += 1;
    if (s.placed) b.placed += 1;
  });

  res.json({
    totals: {
      students: students.length,
      placed: placedCount,
      placementRate: students.length ? Math.round((placedCount / students.length) * 100) : 0,
      drives: drives.length,
      upcomingDrives: drives.filter((d) => d.status === 'upcoming').length,
      applications: apps.length,
      avgResumeScore: resumes.length ? Math.round(resumes.reduce((a, b) => a + b.score, 0) / resumes.length) : 0,
      avgInterviewScore: Math.round(interviews[0]?.avg || 0),
    },
    byCompany: Object.values(byCompany).sort((a, b) => b.applications - a.applications),
    statusCount: Object.entries(statusCount).map(([status, count]) => ({ status, count })),
    aptitudeByCategory: results.map((r) => ({ category: r._id, average: Math.round(r.avg), attempts: r.attempts })),
    resumeBands,
    codingBands,
    branchPlacement: Object.values(branchMap),
  });
});

export const placementReport = asyncHandler(async (req, res) => {
  const apps = await JobApplication.find().populate('student', 'name email').populate({ path: 'drive', populate: { path: 'company', select: 'name' } });
  const profiles = await StudentProfile.find({ user: { $in: apps.map((a) => a.student?._id) } });
  const pm = new Map(profiles.map((p) => [String(p.user), p]));
  const rows = apps.map((a) => {
    const p = pm.get(String(a.student?._id)) || {};
    return {
      student: a.student?.name, email: a.student?.email, rollNo: p.rollNo || '', branch: p.branch || '', cgpa: p.cgpa ?? '',
      company: a.drive?.company?.name, drive: a.drive?.title, role: a.drive?.role, ctcLPA: a.drive?.ctcLPA ?? '', status: a.status,
    };
  });
  if (req.query.format === 'csv') {
    const cols = ['student', 'email', 'rollNo', 'branch', 'cgpa', 'company', 'drive', 'role', 'ctcLPA', 'status'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="placement-report.csv"');
    return res.send(csv);
  }
  res.json({ rows });
});
