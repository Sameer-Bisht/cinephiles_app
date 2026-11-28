import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { MobileBottomNav } from '../components/MobileBottomNav';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 md:py-8 md:pb-8">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
}
