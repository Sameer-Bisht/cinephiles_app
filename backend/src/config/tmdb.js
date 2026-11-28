import axios from 'axios';
import { env } from './env.js';
import { ApiError } from '../utils/ApiError.js';

export const tmdbClient = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  timeout: 15000,
});

tmdbClient.interceptors.request.use((config) => {
  if (!env.TMDB_API_KEY) {
    throw new ApiError(
      503,
      'TMDB_API_KEY is not configured. Please add your TMDB API key in backend/.env.'
    );
  }
  config.params = {
    ...config.params,
    api_key: env.TMDB_API_KEY,
  };
  return config;
});
