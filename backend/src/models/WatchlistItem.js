import mongoose from 'mongoose';

const watchlistItemSchema = new mongoose.Schema(
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
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

watchlistItemSchema.index({ user: 1, movie: 1 }, { unique: true });
watchlistItemSchema.index({ user: 1, addedAt: -1 });

export const WatchlistItem = mongoose.model('WatchlistItem', watchlistItemSchema);
