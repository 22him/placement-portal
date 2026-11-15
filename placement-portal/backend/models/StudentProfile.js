import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    rollNo: { type: String, trim: true },
    branch: { type: String, trim: true },
    year: { type: Number, min: 1, max: 6 },
    cgpa: { type: Number, min: 0, max: 10, default: 0 },
    backlogs: { type: Number, min: 0, default: 0 },
    phone: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    targetRoles: [{ type: String, trim: true }],
    github: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    placed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('StudentProfile', schema);
