import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingQuestion', required: true },
    status: { type: String, enum: ['attempted', 'solved'], default: 'attempted' },
    language: String,
    code: { type: String, maxlength: 20000 },
    notes: { type: String, maxlength: 2000 },
    solvedAt: Date,
  },
  { timestamps: true }
);
schema.index({ user: 1, question: 1 }, { unique: true });

export default mongoose.model('CodingSubmission', schema);
