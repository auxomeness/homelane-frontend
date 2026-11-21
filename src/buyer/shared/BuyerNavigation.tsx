import { NavLink } from 'react-router';
import './BuyerNavigation.css';

const items = [
  { label: 'Home', to: '/buyer/home' },
  { label: 'Map', to: '/buyer/map' },
  { label: 'Viewings', to: '/buyer/viewings' },
  { label: 'Properties', to: '/buyer/properties' },
];

export default function BuyerNavigation() {
  return (
    <nav className="buyer-nav" aria-label="Buyer pages">
      {items.map(({ label, to }) => (
        <NavLink
          key={label}
          to={to}
          end
          className={({ isActive }) => `buyer-nav__item${isActive ? ' is-active' : ''}`}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
