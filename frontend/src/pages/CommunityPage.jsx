import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  Activity,
  ExternalLink,
  Film,
  Newspaper,
  Search,
  Sparkles,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { socialApi } from '../api/social.api';
import { newsApi } from '../api/news.api';
import { getPosterUrl } from '../utils/tmdb';

const VERDICT_BADGE = {
  skip: { label: 'Pass', classes: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  casual: { label: 'Casual', classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  recommended: { label: 'Worth It', classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  masterpiece: { label: 'Masterpiece', classes: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
};

const NEWS_SOURCES = [
  { key: 'all', label: 'All Sources' },
  { key: 'variety', label: 'Variety' },
  { key: 'thr', label: 'Hollywood Reporter' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'indiewire', label: 'IndieWire' },
];

function NewsCard({ article }) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 transition hover:border-teal-500/50 hover:bg-zinc-900 sm:flex-row"
    >
      {article.imageUrl ? (
        <img
          src={article.imageUrl}
          alt={article.title}
          loading="lazy"
          className="h-44 w-full shrink-0 rounded-xl bg-zinc-950 object-cover sm:h-28 sm:w-44"
        />
      ) : (
        <div className="flex h-28 w-full shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-zinc-700 sm:w-44">
          <Newspaper className="h-7 w-7" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 font-medium text-teal-300">
              {article.sourceName}
            </span>
            <span className="text-zinc-500">
              {new Date(article.publishedAt).toLocaleDateString()}
            </span>
            {article.matchedReasons?.length > 0 && (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                Matches: {article.matchedReasons.join(', ')}
              </span>
            )}
          </div>

          <h3 className="line-clamp-2 text-base font-semibold text-white group-hover:text-teal-300">
            {article.title}
          </h3>

          {article.summary && (
            <p className="line-clamp-2 text-xs leading-relaxed text-zinc-400">
              {article.summary}
            </p>
          )}
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 group-hover:text-teal-300">
          Read article <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </a>
  );
}

export function CommunityPage() {
  const [feedTab, setFeedTab] = useState('following'); // 'following' | 'news' | 'for-you'
  const [newsSource, setNewsSource] = useState('all');
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
    enabled: feedTab === 'following',
  });

  const newsQuery = useQuery({
    queryKey: ['news', 'latest', newsSource],
    queryFn: () => newsApi.getLatest(newsSource, 30),
    enabled: feedTab === 'news',
    staleTime: 5 * 60 * 1000,
  });

  const forYouQuery = useQuery({
    queryKey: ['news', 'for-you'],
    queryFn: newsApi.getForYou,
    enabled: feedTab === 'for-you',
    staleTime: 5 * 60 * 1000,
  });

  const feedItems = feedQuery.data?.pages.flatMap((p) => p.results) || [];

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Left: Feed Tabs (Following / News / For You) */}
      <div className="space-y-5 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {feedTab === 'following' ? (
              <Activity className="h-5 w-5 text-teal-400" />
            ) : feedTab === 'news' ? (
              <Newspaper className="h-5 w-5 text-sky-400" />
            ) : (
              <Sparkles className="h-5 w-5 text-amber-400" />
            )}
            <h1 className="text-2xl font-bold text-white">
              {feedTab === 'following'
                ? 'Following Feed'
                : feedTab === 'news'
                  ? 'Movie Industry News'
                  : 'For You'}
            </h1>
          </div>

          <div className="flex flex-wrap gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/70 p-1 text-xs">
            <button
              type="button"
              onClick={() => setFeedTab('following')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                feedTab === 'following'
                  ? 'bg-teal-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              Following
            </button>
            <button
              type="button"
              onClick={() => setFeedTab('news')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                feedTab === 'news'
                  ? 'bg-teal-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Newspaper className="h-3.5 w-3.5" />
              News
            </button>
            <button
              type="button"
              onClick={() => setFeedTab('for-you')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                feedTab === 'for-you'
                  ? 'bg-teal-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              For You
            </button>
          </div>
        </div>

        {feedTab === 'following' ? (
          feedQuery.isLoading ? (
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
                const mediaType = item.movie?.mediaType || 'movie';
                return (
                  <article
                    key={item._id}
                    className="flex gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4"
                  >
                    <Link
                      to={`/title/${mediaType}/${item.tmdbId}`}
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
                            className="font-semibold text-white hover:text-teal-300"
                          >
                            @{item.user?.username}
                          </Link>{' '}
                          watched{' '}
                          <Link
                            to={`/title/${mediaType}/${item.tmdbId}`}
                            className="font-semibold text-white hover:text-teal-300"
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
          )
        ) : feedTab === 'news' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {NEWS_SOURCES.map((src) => (
                <button
                  key={src.key}
                  type="button"
                  onClick={() => setNewsSource(src.key)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    newsSource === src.key
                      ? 'border-teal-500 bg-teal-600/20 text-teal-200'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                  }`}
                >
                  {src.label}
                </button>
              ))}
            </div>

            {newsQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 animate-pulse rounded-2xl bg-zinc-900" />
                ))}
              </div>
            ) : newsQuery.isError ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
                Could not load latest movie news right now. Please try again in a moment.
              </div>
            ) : newsQuery.data?.results?.length === 0 ? (
              <p className="text-sm text-zinc-400">No articles found for this source.</p>
            ) : (
              <div className="space-y-3">
                {newsQuery.data?.results?.map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {forYouQuery.data?.interests?.length > 0 ? (
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-2">
                <p className="text-xs font-medium text-zinc-400">
                  Personalized from your watchlog & watchlist:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {forYouQuery.data.interests.slice(0, 8).map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-0.5 text-[11px] text-zinc-300"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              !forYouQuery.isLoading && (
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-xs text-zinc-400">
                  Log movies/series or add titles to your watchlist so we can tailor industry news to
                  your favorite genres, directors, and titles. Showing top headlines for now!
                </div>
              )
            )}

            {forYouQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 animate-pulse rounded-2xl bg-zinc-900" />
                ))}
              </div>
            ) : forYouQuery.isError ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
                Could not load your For You feed right now.
              </div>
            ) : (
              <div className="space-y-3">
                {forYouQuery.data?.results?.map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
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
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-white placeholder-zinc-500 focus:border-teal-500 focus:outline-none"
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
