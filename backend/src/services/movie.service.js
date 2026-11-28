// import { Movie } from '../models/Movie.js';
// import { tmdbClient } from '../config/tmdb.js';
// import { ApiError } from '../utils/ApiError.js';

// const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// const mapTmdbSummary = (m) => ({
//   tmdbId: m.id,
//   title: m.title,
//   posterPath: m.poster_path || '',
//   backdropPath: m.backdrop_path || '',
//   releaseDate: m.release_date || '',
//   releaseYear: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
//   overview: m.overview || '',
// });

// const extractMovieMetadata = (data) => {
//   const directorObj = data.credits?.crew?.find((c) => c.job === 'Director');
//   const topCast = (data.credits?.cast || []).slice(0, 8).map((person) => ({
//     tmdbPersonId: person.id,
//     name: person.name,
//     character: person.character || '',
//     profilePath: person.profile_path || '',
//   }));

//   const trailer =
//     data.videos?.results?.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
//     data.videos?.results?.find((v) => v.site === 'YouTube');

//   return {
//     tmdbId: data.id,
//     title: data.title,
//     tagline: data.tagline || '',
//     posterPath: data.poster_path || '',
//     backdropPath: data.backdrop_path || '',
//     releaseDate: data.release_date || '',
//     releaseYear: data.release_date ? Number(data.release_date.slice(0, 4)) : null,
//     runtime: data.runtime || null,
//     genres: (data.genres || []).map((g) => g.name),
//     overview: data.overview || '',
//     director: directorObj?.name || '',
//     cast: topCast,
//     trailerKey: trailer?.key || '',
//     cachedAt: new Date(),
//   };
// };

// export const searchMovies = async (query, page = 1) => {
//   if (!query?.trim()) {
//     return { results: [], page: 1, totalPages: 0, totalResults: 0 };
//   }

//   try {
//     const { data } = await tmdbClient.get('/search/movie', {
//       params: { query: query.trim(), page, include_adult: false },
//     });

//     return {
//       results: (data.results || []).map(mapTmdbSummary),
//       page: data.page,
//       totalPages: Math.min(data.total_pages || 1, 500),
//       totalResults: data.total_results || 0,
//     };
//   } catch (error) {
//     if (error instanceof ApiError) throw error;
//     throw new ApiError(502, 'Failed to fetch search results from TMDB');
//   }
// };

// export const getTrendingMovies = async (page = 1) => {
//   try {
//     const { data } = await tmdbClient.get('/trending/movie/week', {
//       params: { page },
//     });

//     return {
//       results: (data.results || []).map(mapTmdbSummary),
//       page: data.page,
//       totalPages: Math.min(data.total_pages || 1, 500),
//     };
//   } catch (error) {
//     if (error instanceof ApiError) throw error;
//     throw new ApiError(502, 'Failed to fetch trending movies from TMDB');
//   }
// };

// export const getOrCacheMovieByTmdbId = async (tmdbId) => {
//   const numericId = Number(tmdbId);
//   if (!Number.isInteger(numericId) || numericId <= 0) {
//     throw new ApiError(400, 'Invalid TMDB movie ID');
//   }

//   // 1. Check MongoDB cache first
//   const cached = await Movie.findOne({ tmdbId: numericId });
//   const isFresh = cached && Date.now() - new Date(cached.cachedAt).getTime() < CACHE_TTL_MS;

//   if (isFresh) {
//     return { movie: cached, source: 'cache' };
//   }

//   // 2. Cache miss or stale -> fetch from TMDB and upsert metadata (preserving verdictCounts)
//   try {
//     const { data } = await tmdbClient.get(`/movie/${numericId}`, {
//       params: { append_to_response: 'credits,videos' },
//     });

//     const metadata = extractMovieMetadata(data);
//     const movie = await Movie.findOneAndUpdate(
//       { tmdbId: numericId },
//       { $set: metadata },
//       { upsert: true, new: true, setDefaultsOnInsert: true }
//     );

//     return { movie, source: 'tmdb' };
//   } catch (error) {
//     if (error instanceof ApiError) throw error;
//     if (error.response?.status === 404) {
//       throw new ApiError(404, 'Movie not found on TMDB');
//     }
//     // If TMDB is temporarily down but we have a stale cache, fall back gracefully
//     if (cached) {
//       return { movie: cached, source: 'stale-cache' };
//     }
//     throw new ApiError(502, 'Failed to fetch movie details from TMDB');
//   }
// };





import { Movie } from '../models/Movie.js';
import { tmdbClient } from '../config/tmdb.js';
import { ApiError } from '../utils/ApiError.js';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const MEDIA_TYPES = ['movie', 'tv'];
// "anime" isn't a TMDB media type. Anime is TV/movies with the Animation genre in Japanese,
// so it's exposed as a filter on top of 'movie' | 'tv'.
const SEARCH_TYPES = ['all', 'movie', 'tv', 'anime'];
const ANIMATION_GENRE_ID = 16;

const yearFrom = (date) => (date ? Number(date.slice(0, 4)) : null);

const looksLikeAnime = (genreIds = [], originalLanguage = '') =>
  genreIds.includes(ANIMATION_GENRE_ID) && originalLanguage === 'ja';

// `forcedType` is used when the TMDB endpoint is type-specific (e.g. /search/tv),
// because those results don't include a `media_type` field.
const mapTmdbSummary = (m, forcedType) => {
  const releaseDate = m.release_date || m.first_air_date || '';
  return {
    tmdbId: m.id,
    mediaType: forcedType || m.media_type,
    title: m.title || m.name || '',
    posterPath: m.poster_path || '',
    backdropPath: m.backdrop_path || '',
    releaseDate,
    releaseYear: yearFrom(releaseDate),
    overview: m.overview || '',
    isAnime: looksLikeAnime(m.genre_ids, m.original_language),
  };
};

const extractMediaMetadata = (data, mediaType) => {
  const isTv = mediaType === 'tv';

  const directorObj = isTv ? null : data.credits?.crew?.find((c) => c.job === 'Director');
  const topCast = (data.credits?.cast || []).slice(0, 8).map((person) => ({
    tmdbPersonId: person.id,
    name: person.name,
    character: person.character || '',
    profilePath: person.profile_path || '',
  }));

  const trailer =
    data.videos?.results?.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    data.videos?.results?.find((v) => v.site === 'YouTube');

  const releaseDate = (isTv ? data.first_air_date : data.release_date) || '';
  const genreIds = (data.genres || []).map((g) => g.id);

  return {
    tmdbId: data.id,
    mediaType,
    title: (isTv ? data.name : data.title) || '',
    tagline: data.tagline || '',
    posterPath: data.poster_path || '',
    backdropPath: data.backdrop_path || '',
    releaseDate,
    releaseYear: yearFrom(releaseDate),
    // Movies: total runtime. TV: typical episode runtime.
    runtime: isTv
      ? data.episode_run_time?.[0] || data.last_episode_to_air?.runtime || null
      : data.runtime || null,
    genres: (data.genres || []).map((g) => g.name),
    overview: data.overview || '',
    director: directorObj?.name || '',
    creators: isTv ? (data.created_by || []).map((c) => c.name) : [],
    numberOfSeasons: isTv ? data.number_of_seasons || null : null,
    numberOfEpisodes: isTv ? data.number_of_episodes || null : null,
    status: data.status || '',
    originalLanguage: data.original_language || '',
    isAnime: looksLikeAnime(genreIds, data.original_language),
    cast: topCast,
    trailerKey: trailer?.key || '',
    cachedAt: new Date(),
  };
};

const assertValidType = (type) => {
  if (!SEARCH_TYPES.includes(type)) {
    throw new ApiError(400, `Invalid type. Use one of: ${SEARCH_TYPES.join(', ')}`);
  }
};

/**
 * Search movies, TV series and anime.
 * type: 'all' (default) | 'movie' | 'tv' | 'anime'
 */
export const searchMedia = async (query, page = 1, type = 'all') => {
  if (!query?.trim()) {
    return { results: [], page: 1, totalPages: 0, totalResults: 0 };
  }
  assertValidType(type);

  const isSpecific = type === 'movie' || type === 'tv';
  const endpoint = isSpecific ? `/search/${type}` : '/search/multi';

  try {
    const { data } = await tmdbClient.get(endpoint, {
      params: { query: query.trim(), page, include_adult: false },
    });

    let results = (data.results || [])
      // /search/multi also returns people; drop them
      .filter((r) => isSpecific || MEDIA_TYPES.includes(r.media_type))
      .map((r) => mapTmdbSummary(r, isSpecific ? type : undefined));

    if (type === 'anime') {
      results = results.filter((r) => r.isAnime);
    }

    return {
      results,
      page: data.page,
      totalPages: Math.min(data.total_pages || 1, 500),
      totalResults: data.total_results || 0,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('TMDB search error:', error.response?.status, error.message);
    throw new ApiError(502, 'Failed to fetch search results from TMDB');
  }
};

/**
 * Trending titles this week.
 * type: 'all' (default) | 'movie' | 'tv' | 'anime'
 */
export const getTrendingMedia = async (page = 1, type = 'all') => {
  assertValidType(type);

  try {
    // Anime has no trending endpoint, so use discover sorted by popularity
    if (type === 'anime') {
      const { data } = await tmdbClient.get('/discover/tv', {
        params: {
          page,
          with_genres: ANIMATION_GENRE_ID,
          with_original_language: 'ja',
          sort_by: 'popularity.desc',
        },
      });

      return {
        results: (data.results || []).map((r) => mapTmdbSummary(r, 'tv')),
        page: data.page,
        totalPages: Math.min(data.total_pages || 1, 500),
      };
    }

    const isSpecific = type === 'movie' || type === 'tv';
    const { data } = await tmdbClient.get(`/trending/${type}/week`, { params: { page } });

    return {
      results: (data.results || [])
        .filter((r) => isSpecific || MEDIA_TYPES.includes(r.media_type))
        .map((r) => mapTmdbSummary(r, isSpecific ? type : undefined)),
      page: data.page,
      totalPages: Math.min(data.total_pages || 1, 500),
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('TMDB trending error:', error.response?.status, error.message);
    throw new ApiError(502, 'Failed to fetch trending titles from TMDB');
  }
};

/**
 * Get a movie or TV series, from the MongoDB cache when fresh, otherwise from TMDB.
 * TMDB movie IDs and TV IDs overlap, so a title is identified by (tmdbId + mediaType).
 */
export const getOrCacheMediaByTmdbId = async (tmdbId, mediaType = 'movie') => {
  const numericId = Number(tmdbId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new ApiError(400, 'Invalid TMDB ID');
  }
  if (!MEDIA_TYPES.includes(mediaType)) {
    throw new ApiError(400, "Invalid media type. Use 'movie' or 'tv'");
  }

  // 1. Check MongoDB cache first
  const cached = await Movie.findOne({ tmdbId: numericId, mediaType });
  const isFresh = cached && Date.now() - new Date(cached.cachedAt).getTime() < CACHE_TTL_MS;

  if (isFresh) {
    return { movie: cached, source: 'cache' };
  }

  // 2. Cache miss or stale -> fetch from TMDB and upsert metadata (preserving verdictCounts)
  try {
    const { data } = await tmdbClient.get(`/${mediaType}/${numericId}`, {
      params: { append_to_response: 'credits,videos' },
    });

    const metadata = extractMediaMetadata(data, mediaType);
    const movie = await Movie.findOneAndUpdate(
      { tmdbId: numericId, mediaType },
      { $set: metadata },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return { movie, source: 'tmdb' };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.response?.status === 404) {
      throw new ApiError(404, `${mediaType === 'tv' ? 'Series' : 'Movie'} not found on TMDB`);
    }
    console.error('TMDB detail error:', mediaType, numericId, error.response?.status, error.message);
    // If TMDB is temporarily down but we have a stale cache, fall back gracefully
    if (cached) {
      return { movie: cached, source: 'stale-cache' };
    }
    throw new ApiError(502, 'Failed to fetch details from TMDB');
  }
};

// Backwards-compatible aliases so existing controllers keep working
export const searchMovies = (query, page = 1, type = 'all') => searchMedia(query, page, type);
export const getTrendingMovies = (page = 1, type = 'all') => getTrendingMedia(page, type);
export const getOrCacheMovieByTmdbId = (tmdbId, mediaType = 'movie') =>
  getOrCacheMediaByTmdbId(tmdbId, mediaType);