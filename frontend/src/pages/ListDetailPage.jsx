import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Globe, Lock, Pencil, Trash2 } from 'lucide-react';
import { listsApi } from '../api/lists.api';
import { MovieCard } from '../components/MovieCard';

export function ListDetailPage() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const detailQuery = useQuery({
    queryKey: ['lists', 'detail', listId],
    queryFn: () => listsApi.getListDetail(listId, 1),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => listsApi.updateList(listId, payload),
    onSuccess: () => {
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => listsApi.deleteList(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      navigate('/lists');
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (tmdbId) => listsApi.removeItem(listId, tmdbId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });

  if (detailQuery.isLoading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-zinc-900" />;
  }

  if (detailQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
        {detailQuery.error?.response?.data?.message || 'Could not load list.'}
      </div>
    );
  }

  const { list, isOwner, items } = detailQuery.data;

  const startEditing = () => {
    setTitle(list.title);
    setDescription(list.description || '');
    setIsPublic(list.isPublic);
    setEditing(true);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({ title, description, isPublic });
            }}
            className="space-y-4"
          >
            <input
              type="text"
              required
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-lg font-bold text-white focus:border-teal-500 focus:outline-none"
            />
            <textarea
              rows={2}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-white focus:border-teal-500 focus:outline-none"
            />
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 accent-teal-600"
              />
              <span>Public list</span>
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                {list.isPublic ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <Globe className="h-3.5 w-3.5" /> Public
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-400">
                    <Lock className="h-3.5 w-3.5" /> Private
                  </span>
                )}
                <span>â€¢</span>
                <span>
                  Curated by{' '}
                  <Link
                    to={`/u/${list.owner?.username}`}
                    className="font-semibold text-zinc-200 hover:text-teal-300"
                  >
                    @{list.owner?.username}
                  </Link>
                </span>
              </div>

              <h1 className="text-2xl font-bold text-white sm:text-3xl">{list.title}</h1>
              {list.description && (
                <p className="max-w-2xl text-sm text-zinc-300">{list.description}</p>
              )}
              <p className="text-xs text-zinc-500">
                {list.itemsCount} {list.itemsCount === 1 ? 'film' : 'films'}
              </p>
            </div>

            {isOwner && (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={startEditing}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-10 text-center space-y-3">
          <p className="text-sm text-zinc-400">No films in this list yet.</p>
          {isOwner && (
            <Link
              to="/search"
              className="inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
            >
              Search movies to add
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
          {items.map(({ movie }) => (
            <div key={movie.tmdbId} className="group relative">
              <MovieCard movie={movie} />
              {isOwner && (
                <button
                  type="button"
                  title="Remove from list"
                  onClick={() => removeItemMutation.mutate(movie.tmdbId)}
                  className="absolute left-2 top-2 rounded-lg bg-black/75 p-1.5 text-zinc-300 opacity-0 backdrop-blur-sm transition hover:bg-rose-600 hover:text-white group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
