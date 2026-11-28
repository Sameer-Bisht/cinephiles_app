import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { notificationsApi } from '../api/notifications.api';
import { useSocketStore } from '../store/socketStore';

const formatNotificationText = (n) => {
  const actor = `@${n.actor?.username || 'someone'}`;
  switch (n.type) {
    case 'follow':
      return `${actor} started following you`;
    case 'review_like':
      return `${actor} liked your review`;
    case 'review_comment':
      return `${actor} commented on your review`;
    case 'chat_request':
      return `${actor} sent you a message request`;
    default:
      return `${actor} interacted with you`;
  }
};

const getNotificationLink = (n) => {
  if (n.type === 'follow') return `/u/${n.actor?.username}`;
  if (n.type === 'chat_request') return `/chat?c=${n.entityId}`;
  if (n.meta?.tmdbId) return `/movies/${n.meta.tmdbId}`;
  return '/community';
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();
  const socket = useSocketStore((s) => s.socket);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll(1),
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  useEffect(() => {
    if (!socket) return;
    const onNew = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };
    socket.on('notification:new', onNew);
    return () => socket.off('notification:new', onNew);
  }, [socket, queryClient]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = data?.unreadCount || 0;
  const items = data?.results || [];

  // Auto-mark notifications as read as soon as the user opens and sees them
  useEffect(() => {
    if (open && unreadCount > 0 && !markReadMutation.isPending) {
      markReadMutation.mutate();
    }
  }, [open, unreadCount, markReadMutation]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-lg p-2 text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <span className="text-sm font-semibold text-white">Notifications</span>
            <span className="text-[11px] text-zinc-500">All caught up</span>
          </div>

          <div className="max-h-80 divide-y divide-zinc-800/60 overflow-y-auto">
            {items.length === 0 ? (
              <p className="p-4 text-center text-xs text-zinc-500">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <Link
                  key={n._id}
                  to={getNotificationLink(n)}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-3 text-xs transition hover:bg-zinc-900 ${
                    n.isRead ? 'text-zinc-400' : 'bg-violet-500/5 text-zinc-100'
                  }`}
                >
                  <p>{formatNotificationText(n)}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
