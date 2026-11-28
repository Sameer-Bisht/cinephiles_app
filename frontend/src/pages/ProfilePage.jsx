import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, Film, Lock, MessageSquare, Settings, Trophy, User as UserIcon, UserCheck, UserPlus, Users } from 'lucide-react';
import { socialApi } from '../api/social.api';
import { listsApi } from '../api/lists.api';
import { chatApi } from '../api/chat.api';
import { MovieCard } from '../components/MovieCard';
import { ListCard } from '../components/ListCard';
import { getPosterUrl } from '../utils/tmdb';

const VERDICT_BADGE = {
  skip: { label: 'Pass', classes: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  casual: { label: 'Casual', classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  recommended: { label: 'Worth It', classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  masterpiece: { label: 'Masterpiece', classes: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
};

export function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('reviews');
  const [watchlogPeriod, setWatchlogPeriod] = useState('all'); // 'all' | 'month' | 'year'
  const [watchlogSort, setWatchlogSort] = useState('latest'); // 'latest' | 'oldest'

  const profileQuery = useQuery({
    queryKey: ['profile', username],
    queryFn: () => socialApi.getProfile(username),
  });

  const reviewsQuery = useQuery({
    queryKey: ['profile', username, 'reviews'],
    queryFn: () => socialApi.getUserReviews(username, 1),
    enabled: activeTab === 'reviews',
  });

  const watchlogQuery = useQuery({
    queryKey: ['profile', username, 'watchlog', watchlogPeriod, watchlogSort],
    queryFn: () =>
      socialApi.getUserWatchlog(username, { period: watchlogPeriod, sort: watchlogSort, page: 1 }),
    enabled: activeTab === 'watchlog',
  });

  const isSelfProfile = Boolean(profileQuery.data?.relationship?.isSelf);

  const watchlistQuery = useQuery({
    queryKey: ['profile', username, 'watchlist'],
    queryFn: () => socialApi.getUserWatchlist(username, 1),
    enabled: activeTab === 'watchlist' && isSelfProfile,
  });

  const listsQuery = useQuery({
    queryKey: ['lists', 'user', username],
    queryFn: () => listsApi.getUserLists(username),
    enabled: activeTab === 'lists',
  });

  const followersQuery = useQuery({
    queryKey: ['profile', username, 'followers'],
    queryFn: () => socialApi.getFollowers(username, 1),
    enabled: activeTab === 'followers',
  });

  const followingQuery = useQuery({
    queryKey: ['profile', username, 'following'],
    queryFn: () => socialApi.getFollowing(username, 1),
    enabled: activeTab === 'following',
  });

  const followRowMutation = useMutation({
    mutationFn: ({ targetUsername, currentlyFollowing }) =>
      currentlyFollowing ? socialApi.unfollow(targetUsername) : socialApi.follow(targetUsername),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
      queryClient.invalidateQueries({ queryKey: ['profile', username, 'followers'] });
      queryClient.invalidateQueries({ queryKey: ['profile', username, 'following'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const followMutation = useMutation({
    mutationFn: (currentlyFollowing) =>
      currentlyFollowing ? socialApi.unfollow(username) : socialApi.follow(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const messageMutation = useMutation({
    mutationFn: () => chatApi.startConversation(username),
    onSuccess: (conv) => {
      navigate(`/chat?c=${conv._id}`);
    },
  });

  if (profileQuery.isLoading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-zinc-900" />;
  }

  if (profileQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
        {profileQuery.error?.response?.data?.message || 'Could not load profile.'}
      </div>
    );
  }

  const { user: profileUser, stats, relationship } = profileQuery.data;

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <section className="flex flex-col gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-start gap-5">
          {profileUser.avatarUrl ? (
            <img
              src={profileUser.avatarUrl}
              alt={profileUser.displayName}
              className="h-20 w-20 shrink-0 rounded-full border border-zinc-700 object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400">
              <UserIcon className="h-9 w-9" />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-white">
                {profileUser.displayName || profileUser.username}
              </h1>
              {stats.watchlogRank && (
                <span
                  title={stats.watchlogRank.subtitle}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300"
                >
                  <Trophy className="h-3 w-3" />
                  {stats.watchlogRank.title}
                </span>
              )}
              {relationship.isMutual && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                  <Users className="h-3 w-3" />
                  Friends
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-400">@{profileUser.username}</p>
            {profileUser.bio && <p className="max-w-xl text-sm text-zinc-300">{profileUser.bio}</p>}

            <div className="flex flex-wrap gap-5 pt-1 text-sm text-zinc-400">
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className="hover:text-white transition"
              >
                <strong className="text-white">{stats.reviewsCount}</strong> Reviews
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('followers')}
                className="hover:text-white transition"
              >
                <strong className="text-white">{profileUser.followersCount}</strong> Followers
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('following')}
                className="hover:text-white transition"
              >
                <strong className="text-white">{profileUser.followingCount}</strong> Following
              </button>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          {relationship.isSelf ? (
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            >
              <Settings className="h-4 w-4" />
              Edit Profile
            </Link>
          ) : (
            <>
              <button
                type="button"
                disabled={followMutation.isPending}
                onClick={() => followMutation.mutate(relationship.isFollowing)}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                  relationship.isFollowing
                    ? 'border border-zinc-700 bg-zinc-950 text-zinc-200 hover:border-rose-500/50 hover:text-rose-300'
                    : 'bg-teal-600 text-white hover:bg-teal-500'
                }`}
              >
                {relationship.isFollowing ? (
                  <>
                    <UserCheck className="h-4 w-4" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    {relationship.followsMe ? 'Follow back' : 'Follow'}
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={messageMutation.isPending}
                onClick={() => messageMutation.mutate()}
                className="ml-2 inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800"
              >
                <MessageSquare className="h-4 w-4" />
                Message
              </button>
            </>
          )}
        </div>
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'reviews'
              ? 'bg-teal-600 text-white'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }`}
        >
          Reviews & Diary
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('watchlog')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'watchlog'
              ? 'bg-teal-600 text-white'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }`}
        >
          Watchlog
        </button>
        {relationship.isSelf && (
          <button
            type="button"
            onClick={() => setActiveTab('watchlist')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === 'watchlist'
                ? 'bg-teal-600 text-white'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            Watchlist
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab('lists')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'lists'
              ? 'bg-teal-600 text-white'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }`}
        >
          Lists
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('followers')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'followers'
              ? 'bg-teal-600 text-white'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }`}
        >
          Followers ({profileUser.followersCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('following')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'following'
              ? 'bg-teal-600 text-white'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }`}
        >
          Following ({profileUser.followingCount})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'reviews' ? (
        reviewsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-900" />
            ))}
          </div>
        ) : reviewsQuery.data?.results?.length === 0 ? (
          <p className="text-sm text-zinc-400">No logged films or reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviewsQuery.data?.results?.map((review) => {
              const posterUrl = getPosterUrl(review.movie?.posterPath, 'w185');
              const badge = review.verdict ? VERDICT_BADGE[review.verdict] : null;
              return (
                <div
                  key={review._id}
                  className="flex gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4"
                >
                  <Link
                    to={`/title/${review.movie?.mediaType || 'movie'}/${review.tmdbId}`}
                    className="w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-900"
                  >
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={review.movie?.title}
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
                      <Link
                        to={`/title/${review.movie?.mediaType || 'movie'}/${review.tmdbId}`}
                        className="font-semibold text-white hover:text-teal-300"
                      >
                        {review.movie?.title}{' '}
                        {review.movie?.releaseYear && (
                          <span className="text-xs font-normal text-zinc-500">
                            ({review.movie.releaseYear})
                          </span>
                        )}
                      </Link>
                      {badge && (
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.classes}`}
                        >
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">
                      Watched {new Date(review.watchedAt).toLocaleDateString()}
                    </p>
                    {review.content && (
                      <p className="line-clamp-3 text-sm text-zinc-300">{review.content}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : activeTab === 'watchlog' ? (
        watchlogQuery.isLoading ? (
          <div className="space-y-4">
            <div className="h-28 animate-pulse rounded-2xl bg-zinc-900" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-zinc-900" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Rank & Stats Banner */}
            {watchlogQuery.data && (
              <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-amber-400">
                        Cinephile Status
                      </p>
                      <p className="text-lg font-bold text-white">
                        {watchlogQuery.data.rank?.title}
                      </p>
                      <p className="text-xs text-zinc-400">{watchlogQuery.data.rank?.subtitle}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
                      <p className="text-lg font-bold text-white">
                        {watchlogQuery.data.stats.watchedLastMonth}
                      </p>
                      <p className="text-[11px] text-zinc-400">Past Month</p>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
                      <p className="text-lg font-bold text-white">
                        {watchlogQuery.data.stats.watchedLastYear}
                      </p>
                      <p className="text-[11px] text-zinc-400">Past Year</p>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
                      <p className="text-lg font-bold text-white">
                        {watchlogQuery.data.stats.totalWatched}
                      </p>
                      <p className="text-[11px] text-zinc-400">All Time</p>
                    </div>
                  </div>
                </div>

                {watchlogQuery.data.achievements?.length > 0 && (
                  <div className="flex flex-wrap gap-2 border-t border-zinc-800/80 pt-3">
                    {watchlogQuery.data.achievements.map((ach) => (
                      <span
                        key={ach.key}
                        title={ach.desc}
                        className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-200"
                      >
                        <Award className="h-3.5 w-3.5 text-teal-400" />
                        {ach.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Period & Sort Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/70 p-1 text-xs">
                {[
                  { key: 'all', label: 'All Time' },
                  { key: 'month', label: 'Past Month' },
                  { key: 'year', label: 'Past Year' },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setWatchlogPeriod(p.key)}
                    className={`rounded-lg px-3 py-1.5 font-medium transition ${
                      watchlogPeriod === p.key
                        ? 'bg-teal-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/70 p-1 text-xs">
                {[
                  { key: 'latest', label: 'Latest' },
                  { key: 'oldest', label: 'Oldest' },
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setWatchlogSort(s.key)}
                    className={`rounded-lg px-3 py-1.5 font-medium transition ${
                      watchlogSort === s.key
                        ? 'bg-teal-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {watchlogQuery.data?.results?.length === 0 ? (
              <p className="text-sm text-zinc-400">No watched titles in this time range.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
                {watchlogQuery.data?.results?.map((entry) => (
                  <div key={entry._id} className="space-y-1.5">
                    <MovieCard movie={entry.movie} />
                    <p className="px-1 text-[11px] text-zinc-500">
                      Watched {new Date(entry.watchedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      ) : activeTab === 'watchlist' ? (
        watchlistQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-zinc-900" />
            ))}
          </div>
        ) : watchlistQuery.data?.results?.length === 0 ? (
          <p className="text-sm text-zinc-400">Watchlist is empty.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
            {watchlistQuery.data.results.map(({ movie }) => (
              <MovieCard key={movie.tmdbId} movie={movie} />
            ))}
          </div>
        )
      ) : activeTab === 'lists' ? (
        listsQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl bg-zinc-900" />
            ))}
          </div>
        ) : listsQuery.data?.length === 0 ? (
          <p className="text-sm text-zinc-400">No lists to show.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {listsQuery.data?.map((list) => (
              <ListCard key={list._id} list={list} />
            ))}
          </div>
        )
      ) : (
        (() => {
          const isFollowersTab = activeTab === 'followers';
          const listQuery = isFollowersTab ? followersQuery : followingQuery;
          const users = listQuery.data?.results || [];

          if (listQuery.isLoading) {
            return (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl bg-zinc-900" />
                ))}
              </div>
            );
          }

          if (users.length === 0) {
            return (
              <p className="text-sm text-zinc-400">
                {isFollowersTab ? 'No followers yet.' : 'Not following anyone yet.'}
              </p>
            );
          }

          return (
            <div className="grid gap-3 sm:grid-cols-2">
              {users.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4"
                >
                  <Link to={`/u/${u.username}`} className="flex min-w-0 items-center gap-3">
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt={u.displayName}
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                        <UserIcon className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {u.displayName || u.username}
                      </p>
                      <p className="truncate text-xs text-zinc-400">@{u.username}</p>
                    </div>
                  </Link>

                  {!u.isSelf && (
                    <button
                      type="button"
                      disabled={followRowMutation.isPending}
                      onClick={() =>
                        followRowMutation.mutate({
                          targetUsername: u.username,
                          currentlyFollowing: u.isFollowingByMe,
                        })
                      }
                      className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                        u.isFollowingByMe
                          ? 'border border-zinc-700 bg-zinc-950 text-zinc-200 hover:border-rose-500/50 hover:text-rose-300'
                          : 'bg-teal-600 text-white hover:bg-teal-500'
                      }`}
                    >
                      {u.isFollowingByMe
                        ? 'Following'
                        : isFollowersTab && relationship.isSelf
                          ? 'Follow back'
                          : 'Follow'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })()
      )}
    </div>
  );
}
