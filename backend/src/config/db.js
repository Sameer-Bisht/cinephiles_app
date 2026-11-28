import mongoose from 'mongoose';
import { env } from './env.js';
import { Movie } from '../models/Movie.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);

    // One-time safe migration: backfill mediaType on old cached movies & drop legacy unique index on tmdbId alone
    await Movie.updateMany({ mediaType: { $exists: false } }, { $set: { mediaType: 'movie' } });
    const indexes = await Movie.collection.indexes().catch(() => []);
    if (indexes.some((idx) => idx.name === 'tmdbId_1')) {
      await Movie.collection.dropIndex('tmdbId_1');
      console.log('Dropped legacy Movie tmdbId_1 unique index');
    }
    await Movie.syncIndexes();
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};
