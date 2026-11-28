import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { moviesApi } from '../api/movies.api';
import { MovieCard } from '../components/MovieCard';

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'movie', label: 'Movies' },
  { key: 'tv', label: 'TV Series' },
  { key: 'anime', label: 'Anime' },
];

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialPage = Number(searchParams.get('page')) || 1;
  const initialType = searchParams.get('type') || 'all';

  const [input, setInput] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [mediaType, setMediaType] = useState(initialType);

  useEffect(() => {
    setInput(initialQuery);
    setDebouncedQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setMediaType(initialType);
  }, [initialType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = input.trim();
      setDebouncedQuery(trimmed);
      if (trimmed) {
        setSearchParams({ q: trimmed, page: '1', type: mediaType }, { replace: true });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [input, mediaType, setSearchParams]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['movies', 'search', debouncedQuery, initialPage, mediaType],
    queryFn: () => moviesApi.searchMovies(debouncedQuery, initialPage, mediaType),
    enabled: Boolean(debouncedQuery),
  });

  const handleTypeChange = (nextType) => {
    setMediaType(nextType);
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery, page: '1', type: nextType }, { replace: true });
    }
  };

  const handlePageChange = (nextPage) => {
    setSearchParams({ q: debouncedQuery, page: String(nextPage), type: mediaType });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search movies, web series, or anime..."
            autoFocus
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/70 p-1 text-xs self-start">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => handleTypeChange(f.key)}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                mediaType === f.key
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {!debouncedQuery ? (
        <p className="text-sm text-zinc-400">Type a movie, web series, or anime title above to search TMDB.</p>
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div key={idx} className="aspect-[2/3] animate-pulse rounded-xl bg-zinc-900" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error?.response?.data?.message || 'Search failed. Check your TMDB_API_KEY in backend/.env.'}
        </div>
      ) : data?.results?.length === 0 ? (
        <p className="text-sm text-zinc-400">No movies found for "{debouncedQuery}".</p>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>
              Showing results for <strong className="text-zinc-200">{debouncedQuery}</strong> (
              {data.totalResults} found)
            </span>
            <span>
              Page {data.page} of {data.totalPages}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
            {data.results.map((movie) => (
              <MovieCard key={`${movie.mediaType || 'movie'}-${movie.tmdbId}`} movie={movie} />
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                disabled={data.page <= 1}
                onClick={() => handlePageChange(data.page - 1)}
                className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={data.page >= data.totalPages}
                onClick={() => handlePageChange(data.page + 1)}
                className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
