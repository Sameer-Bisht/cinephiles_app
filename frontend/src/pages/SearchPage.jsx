import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { moviesApi } from '../api/movies.api';
import { MovieCard } from '../components/MovieCard';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialPage = Number(searchParams.get('page')) || 1;

  const [input, setInput] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  useEffect(() => {
    setInput(initialQuery);
    setDebouncedQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = input.trim();
      setDebouncedQuery(trimmed);
      if (trimmed) {
        setSearchParams({ q: trimmed, page: '1' }, { replace: true });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [input, setSearchParams]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['movies', 'search', debouncedQuery, initialPage],
    queryFn: () => moviesApi.searchMovies(debouncedQuery, initialPage),
    enabled: Boolean(debouncedQuery),
  });

  const handlePageChange = (nextPage) => {
    setSearchParams({ q: debouncedQuery, page: String(nextPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search for a movie (e.g. Blade Runner, Interstellar)..."
          autoFocus
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
        />
      </div>

      {!debouncedQuery ? (
        <p className="text-sm text-zinc-400">Type a movie title above to search TMDB.</p>
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
              <MovieCard key={movie.tmdbId} movie={movie} />
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
