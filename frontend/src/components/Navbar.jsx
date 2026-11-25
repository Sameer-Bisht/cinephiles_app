import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, Film, ListVideo, LogOut, MessageSquare, Search, Users, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth.api';
import { NotificationBell } from './NotificationBell';

export function Navbar() {
  const { user, clearSession } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear local session regardless
    } finally {
      clearSession();
      navigate('/login');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
            <Film className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">ReelClub</span>
        </Link>

        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search movies..."
            className="w-full rounded-full border border-zinc-800 bg-zinc-900 py-1.5 pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
          />
        </form>

        <nav className="flex shrink-0 items-center gap-3">
          {user ? (
            <>
              <Link
                to="/community"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
              >
                <Users className="h-4 w-4 text-emerald-400" />
                <span className="hidden md:inline">Community</span>
              </Link>
              <Link
                to="/watchlist"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
              >
                <Bookmark className="h-4 w-4 text-violet-400" />
                <span className="hidden md:inline">Watchlist</span>
              </Link>
              <Link
                to="/lists"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
              >
                <ListVideo className="h-4 w-4 text-amber-400" />
                <span className="hidden md:inline">Lists</span>
              </Link>
              <Link
                to="/chat"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
              >
                <MessageSquare className="h-4 w-4 text-sky-400" />
                <span className="hidden md:inline">Chat</span>
              </Link>
              <NotificationBell />
              <Link
                to={`/u/${user.username}`}
                className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-4 w-4 text-zinc-400" />
                )}
                <span className="hidden sm:inline">@{user.username}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-zinc-300 transition hover:text-white"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-violet-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-violet-500"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
