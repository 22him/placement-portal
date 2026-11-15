import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetRole: String,
    hoursPerWeek: Number,
    weakAreas: [String],
    weeks: [
      {
        week: Number,
        focus: String,
        tasks: [
          {
            title: String,
            resource: String,
            day: String,
            done: { type: Boolean, default: false },
            doneOn: Date,
          },
        ],
      },
    ],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('LearningRoadmap', schema);
