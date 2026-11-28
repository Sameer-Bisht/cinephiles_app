// import { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { Bookmark, Film, ListVideo, LogOut, MessageSquare, Search, Users, User as UserIcon } from 'lucide-react';
// import { useAuthStore } from '../store/authStore';
// import { authApi } from '../api/auth.api';
// import { NotificationBell } from './NotificationBell';

// export function Navbar() {
//   const { user, clearSession } = useAuthStore();
//   const [searchTerm, setSearchTerm] = useState('');
//   const navigate = useNavigate();

//   const handleLogout = async () => {
//     try {
//       await authApi.logout();
//     } catch {
//       // Clear local session regardless
//     } finally {
//       clearSession();
//       navigate('/login');
//     }
//   };

//   const handleSearchSubmit = (e) => {
//     e.preventDefault();
//     const trimmed = searchTerm.trim();
//     if (trimmed) {
//       navigate(`/search?q=${encodeURIComponent(trimmed)}`);
//     } else {
//       navigate('/search');
//     }
//   };

//   return (
//     <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
//       <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
//         <Link to="/" className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-white">
//           <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
//             <Film className="h-4 w-4" />
//           </span>
//           <span className="hidden sm:inline">ReelClub</span>
//         </Link>

//         <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
//           <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder="Search movies..."
//             className="w-full rounded-full border border-zinc-800 bg-zinc-900 py-1.5 pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:border-teal-500 focus:outline-none"
//           />
//         </form>

//         <nav className="flex shrink-0 items-center gap-3">
//           {user ? (
//             <>
//               <Link
//                 to="/community"
//                 className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
//               >
//                 <Users className="h-4 w-4 text-emerald-400" />
//                 <span className="hidden md:inline">Community</span>
//               </Link>
//               <Link
//                 to="/watchlist"
//                 className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
//               >
//                 <Bookmark className="h-4 w-4 text-teal-400" />
//                 <span className="hidden md:inline">Watchlist</span>
//               </Link>
//               <Link
//                 to="/lists"
//                 className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
//               >
//                 <ListVideo className="h-4 w-4 text-amber-400" />
//                 <span className="hidden md:inline">Lists</span>
//               </Link>
//               <Link
//                 to="/chat"
//                 className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
//               >
//                 <MessageSquare className="h-4 w-4 text-sky-400" />
//                 <span className="hidden md:inline">Chat</span>
//               </Link>
//               <NotificationBell />
//               <Link
//                 to={`/u/${user.username}`}
//                 className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800"
//               >
//                 {user.avatarUrl ? (
//                   <img
//                     src={user.avatarUrl}
//                     alt={user.displayName}
//                     className="h-6 w-6 rounded-full object-cover"
//                   />
//                 ) : (
//                   <UserIcon className="h-4 w-4 text-zinc-400" />
//                 )}
//                 <span className="hidden sm:inline">@{user.username}</span>
//               </Link>
//               <button
//                 type="button"
//                 onClick={handleLogout}
//                 className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
//               >
//                 <LogOut className="h-4 w-4" />
//                 <span className="hidden sm:inline">Logout</span>
//               </button>
//             </>
//           ) : (
//             <>
//               <Link
//                 to="/login"
//                 className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-zinc-300 transition hover:text-white"
//               >
//                 Log in
//               </Link>
//               <Link
//                 to="/register"
//                 className="rounded-lg bg-teal-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-teal-500"
//               >
//                 Sign up
//               </Link>
//             </>
//           )}
//         </nav>
//       </div>
//     </header>
//   );
// }






// The above code is commented out, but it represents a React component for a navigation bar (Navbar) in a web application. It includes features such as user authentication, search functionality, and navigation links to different sections of the app. The component uses various libraries like React Router for navigation, Lucide React for icons, and a custom authentication store for managing user state.

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Film,
  ListVideo,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Users,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth.api';
import { NotificationBell } from './NotificationBell';
import { CinephilesLogo } from './CinephilesLogo';

const NAV_LINKS = [
  { to: '/community', label: 'Community', icon: Users, color: 'text-emerald-400' },
  { to: '/watchlist', label: 'Watchlist', icon: Bookmark, color: 'text-teal-400' },
  { to: '/lists', label: 'Lists', icon: ListVideo, color: 'text-amber-400' },
  { to: '/chat', label: 'Chat', icon: MessageSquare, color: 'text-sky-400' },
];

// Defined outside Navbar so the input keeps focus while typing
function SearchForm({ value, onChange, onSubmit, className = '' }) {
  return (
    <form onSubmit={onSubmit} role="search" className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search movies..."
        aria-label="Search movies"
        className="w-full rounded-full border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:border-teal-500 focus:outline-none md:py-1.5"
      />
    </form>
  );
}

function UserAvatar({ user, size = 'h-6 w-6' }) {
  return user.avatarUrl ? (
    <img src={user.avatarUrl} alt={user.displayName} className={`${size} rounded-full object-cover`} />
  ) : (
    <UserIcon className="h-4 w-4 text-zinc-400" />
  );
}

export function Navbar() {
  const { user, clearSession } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const closeMenu = () => setMenuOpen(false);

  // Close the mobile menu with Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const handleLogout = async () => {
    closeMenu();
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
    closeMenu();
    const trimmed = searchTerm.trim();
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/search');
    }
  };

  const desktopLinkClass =
    'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white lg:px-3';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0a0d14]/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4">
        {/* Main row */}
        <div className="flex h-14 items-center gap-3 md:h-16 md:gap-4">
          <Link
            to="/"
            onClick={closeMenu}
            className="flex shrink-0 items-center"
          >
            <CinephilesLogo />
          </Link>

          {/* Search: inline on md+, separate row on mobile (below) */}
          <SearchForm
            value={searchTerm}
            onChange={setSearchTerm}
            onSubmit={handleSearchSubmit}
            className="hidden max-w-sm flex-1 md:block"
          />

          <nav className="ml-auto flex shrink-0 items-center gap-1 md:gap-2" aria-label="Main">
            {user ? (
              <>
                {/* Desktop links: icons at md, icons + labels at lg */}
                {NAV_LINKS.map(({ to, label, icon: Icon, color }) => (
                  <Link key={to} to={to} aria-label={label} title={label} className={`${desktopLinkClass} hidden md:flex`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="hidden lg:inline">{label}</span>
                  </Link>
                ))}

                <NotificationBell />

                <Link
                  to={`/u/${user.username}`}
                  aria-label="Your profile"
                  className="hidden items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800 md:flex"
                >
                  <UserAvatar user={user} />
                  <span className="hidden lg:inline">@{user.username}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Logout"
                  title="Logout"
                  className="hidden items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white md:flex"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden lg:inline">Logout</span>
                </button>

                {/* Mobile menu toggle */}
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={menuOpen}
                  aria-controls="mobile-menu"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-zinc-900 hover:text-white md:hidden"
                >
                  {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-300 transition hover:text-white md:px-3.5"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-teal-500 md:px-3.5"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Mobile menu panel (secondary links: Watchlist, Lists, Settings, Logout) */}
        {user && menuOpen && (
          <div id="mobile-menu" className="border-t border-zinc-800/80 py-3 md:hidden">
            <ul className="space-y-1">
              <li>
                <Link
                  to="/watchlist"
                  onClick={closeMenu}
                  className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-zinc-200 transition hover:bg-zinc-900 hover:text-white"
                >
                  <Bookmark className="h-5 w-5 text-teal-400" />
                  Watchlist
                </Link>
              </li>
              <li>
                <Link
                  to="/lists"
                  onClick={closeMenu}
                  className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-zinc-200 transition hover:bg-zinc-900 hover:text-white"
                >
                  <ListVideo className="h-5 w-5 text-amber-400" />
                  Lists
                </Link>
              </li>
            </ul>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 flex min-h-11 w-full items-center gap-3 rounded-lg border-t border-zinc-800/80 px-3 pt-2 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
