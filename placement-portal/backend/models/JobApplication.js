import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    drive: { type: mongoose.Schema.Types.ObjectId, ref: 'PlacementDrive', required: true },
    status: { type: String, enum: ['applied', 'shortlisted', 'selected', 'rejected'], default: 'applied' },
    remarks: String,
  },
  { timestamps: true }
);
schema.index({ student: 1, drive: 1 }, { unique: true });

export default mongoose.model('JobApplication', schema);
