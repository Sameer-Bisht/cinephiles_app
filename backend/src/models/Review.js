import mongoose from 'mongoose';

export const VERDICT_TIERS = ['skip', 'casual', 'recommended', 'masterpiece'];

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
    },
    tmdbId: {
      type: Number,
      required: true,
    },
    verdict: {
      type: String,
      enum: [...VERDICT_TIERS, null],
      default: null,
    },
    content: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: '',
    },
    containsSpoilers: {
      type: Boolean,
      default: false,
    },
    watchedAt: {
      type: Date,
      default: Date.now,
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ user: 1, movie: 1 }, { unique: true });
reviewSchema.index({ movie: 1, createdAt: -1 });
reviewSchema.index({ movie: 1, likesCount: -1 });
reviewSchema.index({ user: 1, watchedAt: -1 });

export const Review = mongoose.model('Review', reviewSchema);
