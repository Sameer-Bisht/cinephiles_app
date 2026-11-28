import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Search, Users, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function MobileBottomNav() {
  const { user } = useAuthStore();
  const { pathname } = useLocation();

  const profilePath = user ? `/u/${user.username}` : '/login';

  const items = [
    { to: '/', label: 'Home', icon: Home, match: (p) => p === '/' },
    { to: '/search', label: 'Search', icon: Search, match: (p) => p.startsWith('/search') },
    { to: '/community', label: 'Feed', icon: Users, match: (p) => p.startsWith('/community') },
    { to: '/chat', label: 'Messages', icon: MessageSquare, match: (p) => p.startsWith('/chat') },
  ];

  const isProfileActive = user
    ? pathname.toLowerCase() === `/u/${user.username.toLowerCase()}`
    : pathname === '/login';

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800/90 bg-zinc-950/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center">
        {items.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className={`flex h-full flex-col items-center justify-center gap-1 transition ${
                active ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}

        <Link
          to={profilePath}
          aria-label="Profile"
          className={`flex h-full flex-col items-center justify-center gap-1 transition ${
            isProfileActive ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName || user.username}
              className={`h-5 w-5 rounded-full object-cover ${
                isProfileActive ? 'ring-2 ring-violet-400' : 'ring-1 ring-zinc-700'
              }`}
            />
          ) : (
            <UserIcon className={`h-5 w-5 ${isProfileActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
          )}
          <span className="text-[10px] font-medium leading-none">
            {user ? 'Profile' : 'Log in'}
          </span>
        </Link>
      </div>
    </nav>
  );
}
