import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Início' },
  { to: '/accounts', label: 'Contas Google' },
  { to: '/calendars', label: 'Agendas' },
  { to: '/bridges', label: 'Bridges' },
  { to: '/logs', label: 'Logs' },
];

export default function Navbar() {
  return (
    <nav className="bg-blue-700 text-white shadow">
      <div className="max-w-5xl mx-auto px-4 flex items-center h-14 gap-2">
        <span className="font-bold text-lg mr-6">📅 Calendar Bridge</span>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `px-3 py-1 rounded text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-900' : 'hover:bg-blue-600'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
