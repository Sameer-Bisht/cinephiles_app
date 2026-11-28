import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, X } from 'lucide-react';
import { listsApi } from '../api/lists.api';

export function AddToListModal({ tmdbId, movieTitle, onClose }) {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const listsQuery = useQuery({
    queryKey: ['lists', 'mine', String(tmdbId)],
    queryFn: () => listsApi.getMyLists(tmdbId),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ listId, containsMovie }) =>
      containsMovie ? listsApi.removeItem(listId, tmdbId) : listsApi.addItem(listId, tmdbId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const created = await listsApi.createList({ title: newTitle.trim(), isPublic });
      await listsApi.addItem(created._id, tmdbId);
      return created;
    },
    onSuccess: () => {
      setNewTitle('');
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createMutation.mutate();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-teal-400">
              Add to List
            </p>
            <h2 className="mt-0.5 line-clamp-1 text-lg font-bold text-white">{movieTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
          {listsQuery.isLoading ? (
            <p className="text-xs text-zinc-500">Loading your lists...</p>
          ) : listsQuery.data?.length === 0 ? (
            <p className="text-xs text-zinc-500">You don't have any lists yet. Create one below!</p>
          ) : (
            listsQuery.data?.map((list) => (
              <button
                key={list._id}
                type="button"
                disabled={toggleMutation.isPending}
                onClick={() =>
                  toggleMutation.mutate({
                    listId: list._id,
                    containsMovie: list.containsMovie,
                  })
                }
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition ${
                  list.containsMovie
                    ? 'border-teal-500/50 bg-teal-500/15 text-white'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{list.title}</p>
                  <p className="text-xs text-zinc-500">{list.itemsCount} films</p>
                </div>
                {list.containsMovie && <Check className="h-4 w-4 shrink-0 text-teal-400" />}
              </button>
            ))
          )}
        </div>

        <form onSubmit={handleCreate} className="space-y-3 border-t border-zinc-800 pt-4">
          <p className="text-xs font-medium text-zinc-400">Or create a new list</p>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={80}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Best of Nolan"
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-teal-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={createMutation.isPending || !newTitle.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Create
            </button>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-3.5 w-3.5 accent-teal-600"
            />
            <span>Make list public</span>
          </label>
        </form>
      </div>
    </div>
  );
}
