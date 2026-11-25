import { Movie } from '../models/Movie.js';
import { tmdbClient } from '../config/tmdb.js';
import { ApiError } from '../utils/ApiError.js';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const mapTmdbSummary = (m) => ({
  tmdbId: m.id,
  title: m.title,
  posterPath: m.poster_path || '',
  backdropPath: m.backdrop_path || '',
  releaseDate: m.release_date || '',
  releaseYear: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
  overview: m.overview || '',
});

const extractMovieMetadata = (data) => {
  const directorObj = data.credits?.crew?.find((c) => c.job === 'Director');
  const topCast = (data.credits?.cast || []).slice(0, 8).map((person) => ({
    tmdbPersonId: person.id,
    name: person.name,
    character: person.character || '',
    profilePath: person.profile_path || '',
  }));

  const trailer =
    data.videos?.results?.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    data.videos?.results?.find((v) => v.site === 'YouTube');

  return {
    tmdbId: data.id,
    title: data.title,
    tagline: data.tagline || '',
    posterPath: data.poster_path || '',
    backdropPath: data.backdrop_path || '',
    releaseDate: data.release_date || '',
    releaseYear: data.release_date ? Number(data.release_date.slice(0, 4)) : null,
    runtime: data.runtime || null,
    genres: (data.genres || []).map((g) => g.name),
    overview: data.overview || '',
    director: directorObj?.name || '',
    cast: topCast,
    trailerKey: trailer?.key || '',
    cachedAt: new Date(),
  };
};

export const searchMovies = async (query, page = 1) => {
  if (!query?.trim()) {
    return { results: [], page: 1, totalPages: 0, totalResults: 0 };
  }

  try {
    const { data } = await tmdbClient.get('/search/movie', {
      params: { query: query.trim(), page, include_adult: false },
    });

    return {
      results: (data.results || []).map(mapTmdbSummary),
      page: data.page,
      totalPages: Math.min(data.total_pages || 1, 500),
      totalResults: data.total_results || 0,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, 'Failed to fetch search results from TMDB');
  }
};

export const getTrendingMovies = async (page = 1) => {
  try {
    const { data } = await tmdbClient.get('/trending/movie/week', {
      params: { page },
    });

    return {
      results: (data.results || []).map(mapTmdbSummary),
      page: data.page,
      totalPages: Math.min(data.total_pages || 1, 500),
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, 'Failed to fetch trending movies from TMDB');
  }
};

export const getOrCacheMovieByTmdbId = async (tmdbId) => {
  const numericId = Number(tmdbId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new ApiError(400, 'Invalid TMDB movie ID');
  }

  // 1. Check MongoDB cache first
  const cached = await Movie.findOne({ tmdbId: numericId });
  const isFresh = cached && Date.now() - new Date(cached.cachedAt).getTime() < CACHE_TTL_MS;

  if (isFresh) {
    return { movie: cached, source: 'cache' };
  }

  // 2. Cache miss or stale -> fetch from TMDB and upsert metadata (preserving verdictCounts)
  try {
    const { data } = await tmdbClient.get(`/movie/${numericId}`, {
      params: { append_to_response: 'credits,videos' },
    });

    const metadata = extractMovieMetadata(data);
    const movie = await Movie.findOneAndUpdate(
      { tmdbId: numericId },
      { $set: metadata },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return { movie, source: 'tmdb' };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.response?.status === 404) {
      throw new ApiError(404, 'Movie not found on TMDB');
    }
    // If TMDB is temporarily down but we have a stale cache, fall back gracefully
    if (cached) {
      return { movie: cached, source: 'stale-cache' };
    }
    throw new ApiError(502, 'Failed to fetch movie details from TMDB');
  }
};
