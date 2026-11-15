import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    topic: { type: String, required: true, trim: true },
    link: { type: String, trim: true },
    hints: [String],
    examples: [{ input: String, output: String }],
  },
  { timestamps: true }
);

export default mongoose.model('CodingQuestion', schema);
