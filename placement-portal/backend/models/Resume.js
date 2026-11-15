import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fileName: String,
    targetRole: String,
    text: { type: String, select: false },
    score: Number,
    breakdown: [{ category: String, points: Number, max: Number, note: String }],
    detectedSkills: [String],
    missingSkills: [String],
    aiAnalysis: {
      technicalSkills: [String],
      softSkills: [String],
      strengths: [String],
      atsSuggestions: [String],
      roleImprovements: [String],
      summary: String,
    },
    aiError: String,
  },
  { timestamps: true }
);

export default mongoose.model('Resume', schema);
