import { z } from 'zod';
import { VERDICT_TIERS } from '../models/Review.js';

export const upsertReviewSchema = z.object({
  verdict: z.enum(VERDICT_TIERS).nullable().optional().default(null),
  content: z.string().trim().max(3000, 'Review must be at most 3000 characters').optional().default(''),
  containsSpoilers: z.boolean().optional().default(false),
  watchedAt: z.coerce.date().optional(),
  mediaType: z.enum(['movie', 'tv']).optional().default('movie'),
});

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(500, 'Comment must be at most 500 characters'),
});
