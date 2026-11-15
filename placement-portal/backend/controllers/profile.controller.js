import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import { asyncHandler, HttpError } from '../middleware/auth.js';

const list = (v) => (Array.isArray(v) ? v : String(v || '').split(',')).map((s) => String(s).trim()).filter(Boolean);

export const getProfile = asyncHandler(async (req, res) => {
  const profile = (await StudentProfile.findOne({ user: req.user._id })) || {};
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role }, profile });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, rollNo, branch, year, cgpa, backlogs, phone, skills, targetRoles, github, linkedin } = req.body;
  if (name !== undefined) {
    if (!name.trim()) throw new HttpError(400, 'Name cannot be empty');
    await User.findByIdAndUpdate(req.user._id, { name: name.trim() });
  }
  if (cgpa !== undefined && (isNaN(cgpa) || cgpa < 0 || cgpa > 10)) throw new HttpError(400, 'CGPA must be between 0 and 10');
  if (backlogs !== undefined && (isNaN(backlogs) || backlogs < 0)) throw new HttpError(400, 'Backlogs must be 0 or more');
  if (phone && !/^[0-9+\-\s]{7,15}$/.test(phone)) throw new HttpError(400, 'Invalid phone number');
  const update = { rollNo, branch, year, cgpa, backlogs, phone, github, linkedin };
  if (skills !== undefined) update.skills = list(skills);
  if (targetRoles !== undefined) update.targetRoles = list(targetRoles);
  Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
  const profile = await StudentProfile.findOneAndUpdate({ user: req.user._id }, update, { new: true, upsert: true, runValidators: true });
  res.json({ profile });
});
