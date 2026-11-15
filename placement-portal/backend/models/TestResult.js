import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeTest', required: true },
    category: String,
    answers: [Number],
    score: Number,
    total: Number,
    percent: Number,
    timeTakenSecs: Number,
    topicBreakdown: [{ topic: String, correct: Number, total: Number }],
  },
  { timestamps: true }
);

export default mongoose.model('TestResult', schema);
