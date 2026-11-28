import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  Film,
  ListPlus,
  Lock,
  PenLine,
  Play,
  User as UserIcon,
  X,
} from 'lucide-react';
import { moviesApi } from '../api/movies.api';
import { reviewsApi } from '../api/reviews.api';
import { watchlistApi } from '../api/watchlist.api';
import { useAuthStore } from '../store/authStore';
import { VerdictMeter } from '../components/VerdictMeter';
import { ReviewModal } from '../components/ReviewModal';
import { ReviewCard } from '../components/ReviewCard';
import { AddToListModal } from '../components/AddToListModal';
import { formatRuntime, getBackdropUrl, getPosterUrl, getProfileUrl } from '../utils/tmdb';

export function MovieDetailPage() {
  const { mediaType = 'movie', tmdbId } = useParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showTrailer, setShowTrailer] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [reviewSort, setReviewSort] = useState('recent');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['movie', mediaType, tmdbId],
    queryFn: () => moviesApi.getMovieDetail(tmdbId, mediaType),
  });

  const reviewsQuery = useQuery({
    queryKey: ['reviews', 'movie', mediaType, tmdbId, reviewSort],
    queryFn: () => reviewsApi.getMovieReviews(tmdbId, { sort: reviewSort, mediaType }),
    enabled: Boolean(user),
  });

  const watchlistMutation = useMutation({
    mutationFn: (currentlyInWatchlist) =>
      currentlyInWatchlist
        ? watchlistApi.remove(tmdbId, mediaType)
        : watchlistApi.add(tmdbId, mediaType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movie', mediaType, tmdbId] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-72 animate-pulse rounded-2xl bg-zinc-900" />
        <div className="h-40 animate-pulse rounded-2xl bg-zinc-900" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
        {error?.response?.data?.message || 'Failed to load movie details.'}
      </div>
    );
  }

  const { movie, source, viewerState } = data;
  const inWatchlist = Boolean(viewerState?.inWatchlist);
  const myReview = viewerState?.myReview || null;
  const backdropUrl = getBackdropUrl(movie.backdropPath, 'w1280');
  const posterUrl = getPosterUrl(movie.posterPath, 'w500');
  const runtimeStr = formatRuntime(movie.runtime);

  return (
    <div className="space-y-8">
      {/* Backdrop Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900">
        {backdropUrl && (
          <div className="relative h-64 w-full sm:h-80">
            <img
              src={backdropUrl}
              alt={movie.title}
              className="h-full w-full object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
            {movie.trailerKey && (
              <button
                type="button"
                onClick={() => setShowTrailer(true)}
                className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-black/75 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-teal-600"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Watch Trailer
              </button>
            )}
          </div>
        )}

        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:p-8">
          <div className="-mt-20 w-36 shrink-0 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl sm:-mt-28 sm:w-44">
            {posterUrl ? (
              <img src={posterUrl} alt={movie.title} className="aspect-[2/3] w-full object-cover" />
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center text-zinc-600">
                <Film className="h-10 w-10" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              <span>{movie.isAnime ? 'Anime' : movie.mediaType === 'tv' ? 'TV Series' : 'Movie'}</span>
              {movie.releaseYear && <span>â€¢ {movie.releaseYear}</span>}
              {movie.mediaType === 'tv' && movie.numberOfSeasons && (
                <span>
                  â€¢ {movie.numberOfSeasons} {movie.numberOfSeasons === 1 ? 'Season' : 'Seasons'}
                </span>
              )}
              {runtimeStr && (
                <span className="inline-flex items-center gap-1">
                  â€¢ <Clock className="h-3 w-3" /> {runtimeStr}
                </span>
              )}
              <span className="ml-auto rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 text-[11px] text-zinc-500">
                Source: {source}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
              {movie.title}
            </h1>

            {movie.tagline && <p className="text-sm italic text-zinc-400">"{movie.tagline}"</p>}

            {movie.director && (
              <p className="text-sm text-zinc-300">
                Directed by <span className="font-semibold text-white">{movie.director}</span>
              </p>
            )}
            {movie.creators?.length > 0 && (
              <p className="text-sm text-zinc-300">
                Created by{' '}
                <span className="font-semibold text-white">{movie.creators.join(', ')}</span>
              </p>
            )}

            {movie.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {movie.genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-zinc-700/80 bg-zinc-950 px-3 py-1 text-xs text-zinc-300"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {user && (
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500"
                >
                  {myReview ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Edit Your Log / Verdict
                    </>
                  ) : (
                    <>
                      <PenLine className="h-4 w-4" />
                      Log / Review
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={watchlistMutation.isPending}
                  onClick={() => watchlistMutation.mutate(inWatchlist)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    inWatchlist
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                      : 'border-zinc-700 bg-zinc-950 text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {inWatchlist ? (
                    <>
                      <BookmarkCheck className="h-4 w-4" />
                      In Watchlist
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4" />
                      Watchlist
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setListModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800"
                >
                  <ListPlus className="h-4 w-4" />
                  Add to List
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Overview */}
      {movie.overview && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">Overview</h2>
          <p className="max-w-3xl leading-relaxed text-zinc-300">{movie.overview}</p>
        </section>
      )}

      {/* Verdict Meter (Visible to everyone, including logged-out visitors) */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Cinephiles Verdict Meter</h2>
        <VerdictMeter verdictCounts={movie.verdictCounts} totalVotes={movie.totalVotes} />
      </section>

      {/* Cast */}
      {movie.cast?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Top Cast</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
            {movie.cast.map((person) => {
              const profileUrl = getProfileUrl(person.profilePath, 'w185');
              return (
                <div
                  key={`${person.name}-${person.character}`}
                  className="flex flex-col items-center rounded-xl border border-zinc-800/70 bg-zinc-900/40 p-3 text-center"
                >
                  {profileUrl ? (
                    <img
                      src={profileUrl}
                      alt={person.name}
                      loading="lazy"
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-zinc-500">
                      <UserIcon className="h-6 w-6" />
                    </div>
                  )}
                  <p className="mt-2 line-clamp-1 text-xs font-semibold text-zinc-100">
                    {person.name}
                  </p>
                  {person.character && (
                    <p className="line-clamp-1 text-[11px] text-zinc-500">{person.character}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Auth-walled Reviews & Comments */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Community Reviews</h2>
          {user && (
            <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-1 text-xs">
              <button
                type="button"
                onClick={() => setReviewSort('recent')}
                className={`rounded-md px-3 py-1 font-medium transition ${
                  reviewSort === 'recent'
                    ? 'bg-teal-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Recent
              </button>
              <button
                type="button"
                onClick={() => setReviewSort('likes')}
                className={`rounded-md px-3 py-1 font-medium transition ${
                  reviewSort === 'likes'
                    ? 'bg-teal-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Most Liked
              </button>
            </div>
          )}
        </div>

        {!user ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <p className="flex items-center gap-2 font-semibold text-white">
                  <Lock className="h-4 w-4 text-teal-400" />
                  Reviews & Comments are for members
                </p>
                <p className="text-sm text-zinc-400">
                  Sign in to read full community reviews, view comments, and post your own verdict.
                </p>
              </div>
              <Link
                to="/login"
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-500"
              >
                Log in to unlock
              </Link>
            </div>
          </div>
        ) : reviewsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-900" />
            ))}
          </div>
        ) : reviewsQuery.data?.results?.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-sm text-zinc-400">
            No reviews yet. Be the first to log your verdict!
          </div>
        ) : (
          <div className="space-y-4">
            {reviewsQuery.data?.results?.map((review) => (
              <ReviewCard key={review._id} review={review} tmdbId={tmdbId} />
            ))}
          </div>
        )}
      </section>

      {/* Review Modal */}
      {reviewModalOpen && (
        <ReviewModal
          tmdbId={tmdbId}
          mediaType={mediaType}
          movieTitle={movie.title}
          existingReview={myReview}
          onClose={() => setReviewModalOpen(false)}
        />
      )}

      {/* Add to List Modal */}
      {listModalOpen && (
        <AddToListModal
          tmdbId={tmdbId}
          mediaType={mediaType}
          movieTitle={movie.title}
          onClose={() => setListModalOpen(false)}
        />
      )}

      {/* Trailer Modal */}
      {showTrailer && movie.trailerKey && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setShowTrailer(false)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowTrailer(false)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/70 p-1.5 text-zinc-200 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1`}
                title={`${movie.title} Trailer`}
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
