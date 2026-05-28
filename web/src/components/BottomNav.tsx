import { NavLink } from 'react-router-dom';
import { LayoutGrid, Users, Calendar, ArrowLeftRight, FileText } from 'lucide-react';

const tabs = [
  { to: '/home', label: 'Overview', Icon: LayoutGrid },
  { to: '/accounts', label: 'Contas', Icon: Users },
  { to: '/calendars', label: 'Agendas', Icon: Calendar },
  { to: '/bridges', label: 'Bridges', Icon: ArrowLeftRight },
  { to: '/logs', label: 'Logs', Icon: FileText },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-40">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-brand-600' : ''}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
