import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Activity, Film, Search, User as UserIcon, Users } from 'lucide-react';
import { socialApi } from '../api/social.api';
import { getPosterUrl } from '../utils/tmdb';

const VERDICT_BADGE = {
  skip: { label: 'Pass', classes: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  casual: { label: 'Casual', classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  recommended: { label: 'Worth It', classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  masterpiece: { label: 'Masterpiece', classes: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
};

export function CommunityPage() {
  const [userSearch, setUserSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(userSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  const searchQuery = useQuery({
    queryKey: ['users', 'search', debouncedSearch],
    queryFn: () => socialApi.searchUsers(debouncedSearch),
    enabled: Boolean(debouncedSearch),
  });

  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: socialApi.getFriends,
  });

  const feedQuery = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => socialApi.getFeed(pageParam),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });

  const feedItems = feedQuery.data?.pages.flatMap((p) => p.results) || [];

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Left: Following Activity Feed */}
      <div className="space-y-5 lg:col-span-2">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-violet-400" />
          <h1 className="text-2xl font-bold text-white">Following Feed</h1>
        </div>

        {feedQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-zinc-900" />
            ))}
          </div>
        ) : feedItems.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-sm text-zinc-400">
            Your feed is quiet. Search for cinephiles on the right and follow them to see their
            latest logs and verdicts here!
          </div>
        ) : (
          <div className="space-y-4">
            {feedItems.map((item) => {
              const posterUrl = getPosterUrl(item.movie?.posterPath, 'w185');
              const badge = item.verdict ? VERDICT_BADGE[item.verdict] : null;
              return (
                <article
                  key={item._id}
                  className="flex gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4"
                >
                  <Link
                    to={`/movies/${item.tmdbId}`}
                    className="w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-900"
                  >
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={item.movie?.title}
                        className="aspect-[2/3] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[2/3] items-center justify-center text-zinc-600">
                        <Film className="h-5 w-5" />
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-zinc-300">
                        <Link
                          to={`/u/${item.user?.username}`}
                          className="font-semibold text-white hover:text-violet-300"
                        >
                          @{item.user?.username}
                        </Link>{' '}
                        watched{' '}
                        <Link
                          to={`/movies/${item.tmdbId}`}
                          className="font-semibold text-white hover:text-violet-300"
                        >
                          {item.movie?.title}
                        </Link>
                      </p>
                      {badge && (
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.classes}`}
                        >
                          {badge.label}
                        </span>
                      )}
                    </div>
                    {item.content && (
                      <p className="line-clamp-3 text-sm text-zinc-400">{item.content}</p>
                    )}
                    <p className="text-xs text-zinc-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </article>
              );
            })}

            {feedQuery.hasNextPage && (
              <button
                type="button"
                onClick={() => feedQuery.fetchNextPage()}
                disabled={feedQuery.isFetchingNextPage}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
              >
                {feedQuery.isFetchingNextPage ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right Sidebar: Find People & Mutual Friends */}
      <aside className="space-y-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
          <h2 className="font-semibold text-white">Find Cinephiles</h2>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search @username..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
            />
          </div>

          {debouncedSearch && (
            <div className="space-y-2">
              {searchQuery.isLoading ? (
                <p className="text-xs text-zinc-500">Searching...</p>
              ) : searchQuery.data?.length === 0 ? (
                <p className="text-xs text-zinc-500">No users found.</p>
              ) : (
                searchQuery.data?.map((u) => (
                  <Link
                    key={u._id}
                    to={`/u/${u.username}`}
                    className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-zinc-800/70"
                  >
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt={u.displayName}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                        <UserIcon className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {u.displayName || u.username}
                      </p>
                      <p className="truncate text-xs text-zinc-500">@{u.username}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-400" />
            <h2 className="font-semibold text-white">Mutual Friends</h2>
          </div>

          {friendsQuery.isLoading ? (
            <p className="text-xs text-zinc-500">Loading friends...</p>
          ) : friendsQuery.data?.length === 0 ? (
            <p className="text-xs text-zinc-400">
              Mutual follows appear here as friends.
            </p>
          ) : (
            <div className="space-y-2">
              {friendsQuery.data?.map((f) => (
                <Link
                  key={f._id}
                  to={`/u/${f.username}`}
                  className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-zinc-800/70"
                >
                  {f.avatarUrl ? (
                    <img
                      src={f.avatarUrl}
                      alt={f.displayName}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {f.displayName || f.username}
                    </p>
                    <p className="truncate text-xs text-zinc-500">@{f.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
