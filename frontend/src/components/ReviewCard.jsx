import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Heart, Loader2, MessageCircle, Send, User as UserIcon } from 'lucide-react';
import { reviewsApi } from '../api/reviews.api';

const VERDICT_BADGE = {
  skip: { label: 'Pass', classes: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  casual: { label: 'Casual', classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  recommended: { label: 'Worth It', classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  masterpiece: { label: 'Masterpiece', classes: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
};

export function ReviewCard({ review, tmdbId }) {
  const queryClient = useQueryClient();
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  const badge = review.verdict ? VERDICT_BADGE[review.verdict] : null;

  const likeMutation = useMutation({
    mutationFn: () => reviewsApi.toggleLike(review._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'movie'] });
    },
  });

  const commentsQuery = useQuery({
    queryKey: ['review', review._id, 'comments'],
    queryFn: () => reviewsApi.getComments(review._id),
    enabled: commentsOpen,
  });

  const addCommentMutation = useMutation({
    mutationFn: (text) => reviewsApi.addComment(review._id, text),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['review', review._id, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['reviews', 'movie'] });
    },
  });

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText.trim());
  };

  return (
    <article className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Link to={`/u/${review.user?.username}`} className="flex items-center gap-3 group">
          {review.user?.avatarUrl ? (
            <img
              src={review.user.avatarUrl}
              alt={review.user.displayName}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
              <UserIcon className="h-4 w-4" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-white group-hover:text-teal-300">
              {review.user?.displayName || review.user?.username}
            </p>
            <p className="text-xs text-zinc-500">
              @{review.user?.username} • {new Date(review.watchedAt).toLocaleDateString()}
            </p>
          </div>
        </Link>

        {badge && (
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badge.classes}`}>
            {badge.label}
          </span>
        )}
      </div>

      {review.content && (
        <div>
          {review.containsSpoilers && !spoilerRevealed ? (
            <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200">
              <span className="inline-flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                This review contains spoilers.
              </span>
              <button
                type="button"
                onClick={() => setSpoilerRevealed(true)}
                className="font-semibold text-amber-300 underline hover:text-amber-200"
              >
                Reveal
              </button>
            </div>
          ) : (
            <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-200">
              {review.content}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 pt-1 text-xs text-zinc-400">
        <button
          type="button"
          onClick={() => likeMutation.mutate()}
          disabled={likeMutation.isPending}
          className={`inline-flex items-center gap-1.5 transition hover:text-rose-400 disabled:opacity-60 ${
            review.likedByMe ? 'text-rose-400' : ''
          }`}
        >
          {likeMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={`h-4 w-4 ${review.likedByMe ? 'fill-current' : ''}`} />
          )}
          <span>{review.likesCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setCommentsOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 transition hover:text-teal-300"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{review.commentsCount}</span>
        </button>
      </div>

      {commentsOpen && (
        <div className="mt-3 space-y-3 border-t border-zinc-800 pt-3">
          {commentsQuery.isLoading ? (
            <p className="text-xs text-zinc-500">Loading comments...</p>
          ) : commentsQuery.data?.length === 0 ? (
            <p className="text-xs text-zinc-500">No comments yet. Start the discussion!</p>
          ) : (
            <div className="space-y-2.5">
              {commentsQuery.data?.map((c) => (
                <div key={c._id} className="rounded-xl bg-zinc-950/70 px-3.5 py-2.5 text-xs">
                  <span className="font-semibold text-zinc-200">@{c.author?.username}</span>{' '}
                  <span className="text-zinc-400">{c.content}</span>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              maxLength={500}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-teal-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={addCommentMutation.isPending}
              className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-500 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
