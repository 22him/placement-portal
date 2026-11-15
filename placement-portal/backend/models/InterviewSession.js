import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['technical', 'hr', 'company'], required: true },
    role: String,
    company: String,
    questions: [
      {
        question: String,
        answer: String,
        score: Number,
        feedback: String,
        improvements: [String],
        idealPoints: [String],
        evaluated: { type: Boolean, default: false },
      },
    ],
    overallScore: Number,
    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  },
  { timestamps: true }
);

export default mongoose.model('InterviewSession', schema);
