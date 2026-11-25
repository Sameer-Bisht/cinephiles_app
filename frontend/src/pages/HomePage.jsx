import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Flame, Search } from 'lucide-react';
import { moviesApi } from '../api/movies.api';
import { useAuthStore } from '../store/authStore';
import { MovieCard } from '../components/MovieCard';

export function HomePage() {
  const { user } = useAuthStore();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['movies', 'trending'],
    queryFn: () => moviesApi.getTrending(1),
  });

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900 via-zinc-950 to-violet-950/30 p-8 sm:p-10">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {user
              ? `Welcome back, ${user.displayName || user.username}.`
              : 'Track films. Rate with verdicts. Talk cinema with friends.'}
          </h1>
          <p className="text-zinc-400">
            Search any film, check the community Verdict Meter, curate custom lists, and chat with
            fellow cinephiles.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
            >
              <Search className="h-4 w-4" />
              Search Movies
            </Link>
            {!user && (
              <Link
                to="/register"
                className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-zinc-900"
              >
                Create free account
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-violet-400" />
          <h2 className="text-xl font-bold text-white">Trending This Week</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={idx} className="aspect-[2/3] animate-pulse rounded-xl bg-zinc-900" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            {error?.response?.data?.message ||
              'Could not load trending movies. Make sure TMDB_API_KEY is set in backend/.env.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
            {(data?.results || []).slice(0, 15).map((movie) => (
              <MovieCard key={movie.tmdbId} movie={movie} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
