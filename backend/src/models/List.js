import mongoose from 'mongoose';

const listSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    itemsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    previewPosters: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

listSchema.index({ owner: 1, updatedAt: -1 });
listSchema.index({ isPublic: 1, createdAt: -1 });

export const List = mongoose.model('List', listSchema);
