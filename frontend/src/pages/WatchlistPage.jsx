import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { watchlistApi } from '../api/watchlist.api';
import { MovieCard } from '../components/MovieCard';

export function WatchlistPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => watchlistApi.getMyWatchlist(1),
  });

  const removeMutation = useMutation({
    mutationFn: (tmdbId) => watchlistApi.remove(tmdbId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Bookmark className="h-5 w-5 text-violet-400" />
          <h1 className="text-2xl font-bold text-white">Your Watchlist</h1>
        </div>
        {data && (
          <span className="text-sm text-zinc-400">
            {data.totalResults} {data.totalResults === 1 ? 'film' : 'films'}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-zinc-900" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-red-400">Failed to load watchlist.</p>
      ) : data?.results?.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-10 text-center space-y-3">
          <p className="text-zinc-400">Your watchlist is empty.</p>
          <Link
            to="/search"
            className="inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            Find movies to add
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
          {data.results.map(({ movie }) => (
            <div key={movie.tmdbId} className="relative group">
              <MovieCard movie={movie} />
              <button
                type="button"
                title="Remove from watchlist"
                onClick={() => removeMutation.mutate(movie.tmdbId)}
                disabled={removeMutation.isPending}
                className="absolute left-2 top-2 rounded-lg bg-black/75 p-1.5 text-zinc-300 opacity-0 backdrop-blur-sm transition hover:bg-rose-600 hover:text-white group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
