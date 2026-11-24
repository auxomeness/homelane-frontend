import { Bell, MessageCircle, UserRound } from 'lucide-react';
import { Link } from 'react-router';
import type { DiscoveryScreen } from './DiscoveryNavigation.js';

interface DiscoveryHeaderProps {
  onNavigate: (screen: DiscoveryScreen) => void;
}

// Header from the Figma: brand mark, wordmark, then bell, messages and profile icons.
// The bell asset already includes the notification dot.
export default function DiscoveryHeader({ onNavigate }: DiscoveryHeaderProps) {
  return (
    <header className="agent-header discovery-header">
      <Link className="agent-header__brand landing-brand" to="/discovery/home"><img src="/logo/Purple%20House%20Path%20Logo%20Icon.png" alt="" />homelane<small>BUYER WORKSPACE</small></Link>
      <div className="agent-header__right"><span className="agent-header__role">Buyer</span><div className="agent-header__actions">
        <button type="button" aria-label="Notifications" onClick={() => onNavigate('notifications')}><Bell size={23}/></button>
        <button type="button" aria-label="Messages" onClick={() => onNavigate('messages')}><MessageCircle size={23}/></button>
        <button type="button" aria-label="Profile" onClick={() => onNavigate('profile')}><UserRound size={23}/></button>
      </div></div>
    </header>
  );
}
