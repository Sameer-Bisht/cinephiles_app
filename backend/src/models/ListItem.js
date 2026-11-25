import mongoose from 'mongoose';

const listItemSchema = new mongoose.Schema(
  {
    list: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'List',
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
    note: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

listItemSchema.index({ list: 1, movie: 1 }, { unique: true });
listItemSchema.index({ list: 1, addedAt: 1 });

export const ListItem = mongoose.model('ListItem', listItemSchema);
