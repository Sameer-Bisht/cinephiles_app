import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Trash2, X } from 'lucide-react';
import { reviewsApi } from '../api/reviews.api';

const VERDICT_OPTIONS = [
  { key: 'skip', label: 'Pass', activeClass: 'border-rose-500 bg-rose-500/20 text-rose-300' },
  { key: 'casual', label: 'Casual', activeClass: 'border-amber-500 bg-amber-500/20 text-amber-300' },
  { key: 'recommended', label: 'Worth It', activeClass: 'border-emerald-500 bg-emerald-500/20 text-emerald-300' },
  { key: 'masterpiece', label: 'Masterpiece', activeClass: 'border-violet-500 bg-violet-500/20 text-violet-300' },
];

export function ReviewModal({ tmdbId, mediaType = 'movie', movieTitle, existingReview, onClose }) {
  const queryClient = useQueryClient();
  const [verdict, setVerdict] = useState(existingReview?.verdict || null);
  const [content, setContent] = useState(existingReview?.content || '');
  const [containsSpoilers, setContainsSpoilers] = useState(
    Boolean(existingReview?.containsSpoilers)
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['movie', mediaType, String(tmdbId)] });
    queryClient.invalidateQueries({ queryKey: ['reviews', 'movie', mediaType, String(tmdbId)] });
    queryClient.invalidateQueries({ queryKey: ['watchlist'] });
  };

  const saveMutation = useMutation({
    mutationFn: (payload) => reviewsApi.upsertMovieReview(tmdbId, payload),
    onSuccess: () => {
      invalidate();
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => reviewsApi.deleteReview(existingReview._id),
    onSuccess: () => {
      invalidate();
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      verdict,
      content,
      containsSpoilers,
      mediaType,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-teal-400">
              {existingReview ? 'Edit your log' : 'Log & Review'}
            </p>
            <h2 className="mt-0.5 text-xl font-bold text-white">{movieTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Your Verdict (optional)
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {VERDICT_OPTIONS.map((opt) => {
                const selected = verdict === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setVerdict(selected ? null : opt.key)}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                      selected
                        ? opt.activeClass
                        : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Review (optional)
            </label>
            <textarea
              rows={4}
              maxLength={3000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts on the direction, pacing, performances..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-white placeholder-zinc-500 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={containsSpoilers}
              onChange={(e) => setContainsSpoilers(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-teal-600"
            />
            <span>Contains spoilers</span>
          </label>

          {(saveMutation.isError || deleteMutation.isError) && (
            <p className="text-sm text-red-400">
              {saveMutation.error?.response?.data?.message ||
                deleteMutation.error?.response?.data?.message ||
                'Action failed'}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            {existingReview ? (
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {deleteMutation.isPending ? 'Deleting...' : 'Delete log'}
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:opacity-50"
              >
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
