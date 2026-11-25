import mongoose from 'mongoose';

const reviewLikeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
      required: true,
    },
  },
  { timestamps: true }
);

reviewLikeSchema.index({ user: 1, review: 1 }, { unique: true });

export const ReviewLike = mongoose.model('ReviewLike', reviewLikeSchema);
