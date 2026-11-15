import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: String,
    website: String,
    industry: String,
    location: String,
    packageLPA: Number,
    roles: [String],
    requiredSkills: [String],
    minCgpa: { type: Number, default: 0 },
    maxBacklogs: { type: Number, default: 0 },
    allowedBranches: [String],
  },
  { timestamps: true }
);

export default mongoose.model('Company', schema);
