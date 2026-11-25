import { z } from 'zod';

export const createListSchema = z.object({
  title: z.string().trim().min(1, 'List title is required').max(80, 'Title max 80 characters'),
  description: z.string().trim().max(500, 'Description max 500 characters').optional().default(''),
  isPublic: z.boolean().optional().default(true),
});

export const updateListSchema = z.object({
  title: z.string().trim().min(1, 'List title cannot be empty').max(80).optional(),
  description: z.string().trim().max(500).optional(),
  isPublic: z.boolean().optional(),
});

export const addListItemSchema = z.object({
  tmdbId: z.coerce.number().int().positive('Valid tmdbId is required'),
  note: z.string().trim().max(200).optional().default(''),
});
