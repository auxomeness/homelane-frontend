import { Bell, Eye, LayoutDashboard, List, Map, Menu, MessageSquare, Plus, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LucideIcon } from 'lucide-react';
import useMobileNavPortal from '../../../shared/useMobileNavPortal.js';

export type AgentScreen = 'dashboard' | 'listings' | 'addListing' | 'viewings' | 'map' | 'inquiries' | 'messages' | 'activity' | 'profile';

interface AgentNavigationProps {
  screen: AgentScreen | null;
  onNavigate: (screen: AgentScreen) => void;
}

const navItems: { label: string; screen: AgentScreen; icon: LucideIcon }[] = [
  { label: 'Overview', screen: 'dashboard', icon: LayoutDashboard },
  { label: 'My listings', screen: 'listings', icon: List },
  { label: 'Map', screen: 'map', icon: Map },
  { label: 'Add listing', screen: 'addListing', icon: Plus },
  { label: 'Viewings', screen: 'viewings', icon: Eye },
  { label: 'Inquiries', screen: 'inquiries', icon: Bell },
  { label: 'Messages', screen: 'messages', icon: MessageSquare },
  { label: 'Activity', screen: 'activity', icon: LayoutDashboard },
  { label: 'Profile', screen: 'profile', icon: UserRound },
];
const primaryScreens: AgentScreen[] = ['dashboard', 'listings', 'map'];

export default function AgentNavigation({ screen, onNavigate }: AgentNavigationProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const usePortal = useMobileNavPortal();

  useEffect(() => {
    if (!moreOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [moreOpen]);

  const navigate = (destination: AgentScreen) => {
    setMoreOpen(false);
    onNavigate(destination);
  };

  const renderItem = ({ label, screen: itemScreen, icon: Icon }: (typeof navItems)[number], mobile = false) => (
    <button
      type="button"
      className={`agent-nav-item${screen === itemScreen ? ' is-active' : ''}`}
      aria-label={label}
      aria-current={screen === itemScreen ? 'page' : undefined}
      key={`${mobile ? 'mobile-' : ''}${itemScreen}`}
      title={label}
      onClick={() => navigate(itemScreen)}
    >
      <Icon className="agent-nav-item__icon" size={22} aria-hidden="true" />
      <span className="agent-nav-item__label">{label}</span>
    </button>
  );

  const navigation = (
    <nav id="agent-nav" className={usePortal ? 'agent-nav--viewport' : undefined} aria-label="Agent workspace">
      <div className="agent-nav-title">
        <h3>Workspace</h3>
      </div>
      <div className="agent-nav-panel">
        {navItems.map((item) => renderItem(item))}
      </div>
      <div className="agent-nav-mobile" aria-label="Primary pages">
        {navItems.slice(0, 3).map((item) => renderItem(item, true))}
        <button type="button" className={`agent-nav-item agent-nav-more${moreOpen || (screen !== null && !primaryScreens.includes(screen)) ? ' is-active' : ''}`} aria-expanded={moreOpen} aria-controls="agent-nav-drawer" onClick={() => setMoreOpen((open) => !open)}>
          {moreOpen ? <X className="agent-nav-item__icon" size={22} aria-hidden="true" /> : <Menu className="agent-nav-item__icon" size={22} aria-hidden="true" />}
          <span className="agent-nav-item__label">More</span>
        </button>
      </div>
      {moreOpen && createPortal(<>
        <button type="button" className="agent-nav-backdrop" aria-label="Close page menu" onClick={() => setMoreOpen(false)} />
        <div className="agent-nav-drawer" id="agent-nav-drawer" aria-label="All workspace pages">
          <div className="agent-nav-drawer__heading"><span>All pages</span><button type="button" aria-label="Close page menu" onClick={() => setMoreOpen(false)}><X size={20} /></button></div>
          {navItems.map((item) => renderItem(item, true))}
        </div>
      </>, document.body)}
    </nav>
  );
  return usePortal ? createPortal(navigation, document.body) : navigation;
}
