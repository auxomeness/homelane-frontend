import { LayoutDashboard, ListChecks, Map, UserRoundCheck, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router';
import './sharedStyles.css';

const navItems: { label: string; path: string; icon: LucideIcon; end?: boolean }[] = [
  { label: 'Overview', path: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Map', path: '/admin/map', icon: Map },
  { label: 'Listing reviews', path: '/admin/listing-reviews', icon: ListChecks },
  { label: 'Agent reviews', path: '/admin/agent-reviews', icon: UserRoundCheck },
];

export default function AdminNavigation() {
  return (
    <nav id="admin-nav" aria-label="Admin workspace">
      <div className="admin-nav-title"><h3>Workspace</h3></div>
      <div className="admin-nav-panel">
        {navItems.map(({ label, path, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            title={label}
            aria-label={label}
            className={({ isActive }) => `admin-nav-item${isActive ? ' is-active' : ''}`}
          >
            <Icon size={22} aria-hidden="true" />
            <span className="admin-nav-item__label">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
