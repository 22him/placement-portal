import Company from '../models/Company.js';
import PlacementDrive from '../models/PlacementDrive.js';
import JobApplication from '../models/JobApplication.js';
import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';
import { asyncHandler, HttpError } from '../middleware/auth.js';
import { crud } from './crud.js';
import { evaluateMatch } from '../utils/match.js';

export const companies = crud(Company, { searchFields: ['name', 'industry', 'location'], sort: { name: 1 }, label: 'Company' });

const driveCrud = crud(PlacementDrive, { searchFields: ['title', 'role'], populate: 'company', sort: { driveDate: 1 }, label: 'Drive' });

function validateDrive(body) {
  if (body.driveDate && body.deadline && new Date(body.deadline) > new Date(body.driveDate)) {
    throw new HttpError(400, 'Application deadline must be on or before the drive date');
  }
}

export const drives = {
  ...driveCrud,
  create: asyncHandler(async (req, res) => {
    validateDrive(req.body);
    const item = await PlacementDrive.create(req.body);
    res.status(201).json({ item: await item.populate('company') });
  }),
  update: asyncHandler(async (req, res) => {
    validateDrive(req.body);
    const item = await PlacementDrive.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('company');
    if (!item) throw new HttpError(404, 'Drive not found');
    res.json({ item });
  }),
  remove: asyncHandler(async (req, res) => {
    const item = await PlacementDrive.findByIdAndDelete(req.params.id);
    if (!item) throw new HttpError(404, 'Drive not found');
    await JobApplication.deleteMany({ drive: item._id });
    res.json({ message: 'Drive and its applications deleted' });
  }),
};

// Student view: all drives with eligibility + application status
export const studentDrives = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const q = {};
  if (status) q.status = status;
  let items = await PlacementDrive.find(q).populate('company').sort({ driveDate: 1 });
  if (search) {
    const re = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    items = items.filter((d) => re.test(d.title) || re.test(d.role) || re.test(d.company?.name || ''));
  }
  const [profile, apps] = await Promise.all([StudentProfile.findOne({ user: req.user._id }), JobApplication.find({ student: req.user._id })]);
  const appMap = new Map(apps.map((a) => [String(a.drive), a.status]));
  res.json({
    items: items.map((d) => {
      const m = evaluateMatch(profile, d);
      return { ...d.toObject(), eligible: m.eligible, missingEligibility: m.missingEligibility, applicationStatus: appMap.get(String(d._id)) || null };
    }),
  });
});

export const apply = asyncHandler(async (req, res) => {
  const drive = await PlacementDrive.findById(req.params.id);
  if (!drive) throw new HttpError(404, 'Drive not found');
  if (drive.status !== 'upcoming') throw new HttpError(400, 'This drive is not open for applications');
  if (new Date(drive.deadline) < new Date()) throw new HttpError(400, 'The application deadline has passed');
  const profile = await StudentProfile.findOne({ user: req.user._id });
  const m = evaluateMatch(profile, drive);
  if (!m.eligible) throw new HttpError(400, `Not eligible: ${m.missingEligibility.join('; ')}`);
  const app = await JobApplication.create({ student: req.user._id, drive: drive._id });
  res.status(201).json({ application: app });
});

export const withdraw = asyncHandler(async (req, res) => {
  const app = await JobApplication.findOne({ student: req.user._id, drive: req.params.id });
  if (!app) throw new HttpError(404, 'Application not found');
  if (app.status !== 'applied') throw new HttpError(400, 'Only pending applications can be withdrawn');
  await app.deleteOne();
  res.json({ message: 'Application withdrawn' });
});

export const myApplications = asyncHandler(async (req, res) => {
  const items = await JobApplication.find({ student: req.user._id }).sort({ createdAt: -1 }).populate({ path: 'drive', populate: 'company' });
  res.json({ items });
});

// Admin
export const allApplications = asyncHandler(async (req, res) => {
  const q = {};
  if (req.query.drive) q.drive = req.query.drive;
  if (req.query.status) q.status = req.query.status;
  const items = await JobApplication.find(q).sort({ createdAt: -1 }).populate('student', 'name email').populate({ path: 'drive', populate: { path: 'company', select: 'name' } });
  const profiles = await StudentProfile.find({ user: { $in: items.map((i) => i.student?._id) } });
  const pm = new Map(profiles.map((p) => [String(p.user), p]));
  res.json({ items: items.map((i) => ({ ...i.toObject(), profile: pm.get(String(i.student?._id)) || null })) });
});

export const updateApplication = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body;
  if (!['applied', 'shortlisted', 'selected', 'rejected'].includes(status)) throw new HttpError(400, 'Invalid status');
  const app = await JobApplication.findByIdAndUpdate(req.params.id, { status, remarks }, { new: true });
  if (!app) throw new HttpError(404, 'Application not found');
  if (status === 'selected') await StudentProfile.findOneAndUpdate({ user: app.student }, { placed: true });
  res.json({ application: app });
});

export const eligibleStudents = asyncHandler(async (req, res) => {
  const drive = await PlacementDrive.findById(req.params.id);
  if (!drive) throw new HttpError(404, 'Drive not found');
  const profiles = await StudentProfile.find().populate('user', 'name email active');
  const applied = new Set((await JobApplication.find({ drive: drive._id })).map((a) => String(a.student)));
  const items = profiles
    .filter((p) => p.user?.active)
    .map((p) => ({ ...evaluateMatch(p, drive), student: p.user, profile: p, applied: applied.has(String(p.user._id)) }))
    .filter((r) => r.eligible)
    .sort((a, b) => b.matchPercent - a.matchPercent);
  res.json({ items });
});

export const listStudents = asyncHandler(async (req, res) => {
  const { search, branch } = req.query;
  const users = await User.find({ role: 'student' }).select('-password').sort({ name: 1 });
  const profiles = await StudentProfile.find({ user: { $in: users.map((u) => u._id) } });
  const pm = new Map(profiles.map((p) => [String(p.user), p]));
  let items = users.map((u) => ({ ...u.toObject(), profile: pm.get(String(u._id)) || {} }));
  if (branch) items = items.filter((i) => i.profile.branch === branch);
  if (search) {
    const s = String(search).toLowerCase();
    items = items.filter((i) => `${i.name} ${i.email} ${i.profile.rollNo || ''}`.toLowerCase().includes(s));
  }
  res.json({ items });
});

export const updateStudent = asyncHandler(async (req, res) => {
  const { name, active, rollNo, branch, year, cgpa, backlogs, skills, placed } = req.body;
  const user = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!user) throw new HttpError(404, 'Student not found');
  if (name !== undefined) user.name = name;
  if (active !== undefined) user.active = Boolean(active);
  await user.save();
  const update = { rollNo, branch, year, cgpa, backlogs, placed };
  if (skills !== undefined) update.skills = (Array.isArray(skills) ? skills : String(skills).split(',')).map((s) => s.trim()).filter(Boolean);
  Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
  const profile = await StudentProfile.findOneAndUpdate({ user: user._id }, update, { new: true, upsert: true, runValidators: true });
  res.json({ student: { ...user.toObject(), password: undefined, profile } });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!user) throw new HttpError(404, 'Student not found');
  await Promise.all([
    StudentProfile.deleteOne({ user: user._id }),
    JobApplication.deleteMany({ student: user._id }),
    user.deleteOne(),
  ]);
  res.json({ message: 'Student and related records deleted' });
});
