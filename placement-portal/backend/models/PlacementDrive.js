import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    title: { type: String, required: true, trim: true },
    role: { type: String, required: true },
    jobDescription: String,
    ctcLPA: Number,
    driveDate: { type: Date, required: true },
    deadline: { type: Date, required: true },
    minCgpa: { type: Number, default: 0 },
    maxBacklogs: { type: Number, default: 0 },
    allowedBranches: [String],
    requiredSkills: [String],
    status: { type: String, enum: ['upcoming', 'closed', 'completed'], default: 'upcoming' },
  },
  { timestamps: true }
);

export default mongoose.model('PlacementDrive', schema);
