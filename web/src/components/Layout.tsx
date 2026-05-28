import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, Users, Calendar, ArrowLeftRight, FileText } from 'lucide-react';
import BottomNav from './BottomNav';

const desktopLinks = [
  { to: '/home', label: 'Overview', Icon: LayoutGrid },
  { to: '/accounts', label: 'Contas', Icon: Users },
  { to: '/calendars', label: 'Agendas', Icon: Calendar },
  { to: '/bridges', label: 'Bridges', Icon: ArrowLeftRight },
  { to: '/logs', label: 'Logs', Icon: FileText },
];

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-50">
      {/* Desktop top nav */}
      <header className="hidden md:block fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-40">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-brand-600 text-base">
            <ArrowLeftRight size={18} />
            Calendar Bridge
          </div>
          <nav className="flex items-center gap-1">
            {desktopLinks.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={15} strokeWidth={isActive ? 2.5 : 1.75} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="w-full max-w-lg mx-auto px-4 pt-6 pb-24 md:pt-20 md:pb-8 md:max-w-2xl lg:max-w-4xl">
        {children}
      </main>

      {/* Bottom nav mobile only */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
