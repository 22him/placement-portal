import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: ['Quantitative', 'Logical', 'Verbal', 'Mixed'], required: true },
    topic: { type: String, trim: true },
    type: { type: String, enum: ['practice', 'mock'], default: 'practice' },
    durationMins: { type: Number, min: 1, default: 15 },
    questions: [
      {
        text: { type: String, required: true },
        options: { type: [String], validate: (v) => v.length >= 2 },
        correctIndex: { type: Number, required: true },
        explanation: String,
        topic: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('AptitudeTest', schema);
