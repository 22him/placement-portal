import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import { asyncHandler, HttpError } from '../middleware/auth.js';

const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });
const emailRe = /^\S+@\S+\.\S+$/;

function checkPassword(pw) {
  if (typeof pw !== 'string' || pw.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) throw new HttpError(400, 'Password must contain letters and numbers');
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, rollNo, branch, year, cgpa } = req.body;
  if (!name?.trim()) throw new HttpError(400, 'Name is required');
  if (!emailRe.test(email || '')) throw new HttpError(400, 'A valid email is required');
  checkPassword(password);
  if (await User.findOne({ email: email.toLowerCase() })) throw new HttpError(409, 'An account with this email already exists');
  const user = await User.create({ name, email, password, role: 'student' });
  await StudentProfile.create({ user: user._id, rollNo, branch, year: year || undefined, cgpa: cgpa || 0 });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

async function loginWithRole(req, res, role) {
  const { email, password } = req.body;
  if (!email || !password) throw new HttpError(400, 'Email and password are required');
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.matchPassword(password))) throw new HttpError(401, 'Invalid email or password');
  if (user.role !== role) throw new HttpError(403, role === 'admin' ? 'This login is for placement officers only' : 'Please use the admin login');
  if (!user.active) throw new HttpError(403, 'Account disabled. Contact the placement office.');
  res.json({ token: signToken(user), user: publicUser(user) });
}

export const login = asyncHandler((req, res) => loginWithRole(req, res, 'student'));
export const adminLogin = asyncHandler((req, res) => loginWithRole(req, res, 'admin'));

export const me = asyncHandler(async (req, res) => res.json({ user: publicUser(req.user) }));

// No email service is bundled. In development the reset link is returned and logged so you can test the flow.
// In production, plug a mailer in here (nodemailer, SES, ...) and stop returning the link.
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!emailRe.test(email || '')) throw new HttpError(400, 'A valid email is required');
  const user = await User.findOne({ email: email.toLowerCase() });
  const response = { message: 'If that email is registered, a reset link has been generated.' };
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    user.resetTokenExpires = Date.now() + 30 * 60 * 1000;
    await user.save();
    const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${token}`;
    console.log('Password reset link:', link);
    if (process.env.NODE_ENV !== 'production') response.devResetLink = link;
  }
  res.json(response);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  checkPassword(password);
  const hash = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ resetTokenHash: hash, resetTokenExpires: { $gt: Date.now() } });
  if (!user) throw new HttpError(400, 'Reset link is invalid or has expired');
  user.password = password;
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  await user.save();
  res.json({ message: 'Password updated. You can now log in.' });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!(await user.matchPassword(currentPassword || ''))) throw new HttpError(400, 'Current password is incorrect');
  checkPassword(newPassword);
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password changed' });
});
