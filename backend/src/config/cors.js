import { env } from './env.js';

const allowedOrigins = [
  env.CLIENT_URL?.replace(/\/$/, ''), // strip trailing slash
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

export const isOriginAllowed = (origin) =>
  !origin ||
  allowedOrigins.includes(origin) ||
  /^https:\/\/.*\.vercel\.app$/.test(origin);

export const corsOrigin = (origin, callback) => {
  if (isOriginAllowed(origin)) return callback(null, true);
  callback(new Error(`CORS: origin ${origin} not allowed`));
};