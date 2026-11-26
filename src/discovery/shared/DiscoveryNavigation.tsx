import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Home, Map, CalendarDays, Building2, MessageCircle, Bell, UserRound, Menu, X } from 'lucide-react';
import type { DiscoveryScreen } from './discoveryRoutes.js';
import useMobileNavPortal from '../../shared/useMobileNavPortal.js';
export type { DiscoveryScreen } from './discoveryRoutes.js';
interface DiscoveryNavigationProps { screen: DiscoveryScreen; onNavigate: (screen: DiscoveryScreen) => void }
const allItems: Array<{ id: DiscoveryScreen; label: string; icon: typeof Home }> = [
  { id: 'home', label: 'Home', icon: Home }, { id: 'properties', label: 'Properties', icon: Building2 }, { id: 'map', label: 'Map', icon: Map },
  { id: 'viewings', label: 'Viewings', icon: CalendarDays }, { id: 'messages', label: 'Messages', icon: MessageCircle }, { id: 'notifications', label: 'Notifications', icon: Bell }, { id: 'profile', label: 'Profile', icon: UserRound },
];
export default function DiscoveryNavigation({ screen, onNavigate }: DiscoveryNavigationProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const usePortal = useMobileNavPortal();
  useEffect(() => {
    if (!moreOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setMoreOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [moreOpen]);
  const primary = allItems.slice(0, 3); const primaryScreens = primary.map((item) => item.id); const moreActive = screen !== null && !primaryScreens.includes(screen);
  const button = (item: typeof allItems[number]) => { const Icon = item.icon; return <button key={item.id} type="button" className={`agent-nav-item${screen === item.id ? ' is-active' : ''}`} aria-current={screen === item.id ? 'page' : undefined} onClick={() => { setMoreOpen(false); onNavigate(item.id); }}><Icon size={22}/><span className="agent-nav-item__label">{item.label}</span></button>; };
  const navigation = (
    <nav id="agent-nav" className={`discovery-agent-nav${usePortal ? ' agent-nav--viewport' : ''}`} aria-label="Buyer workspace navigation">
      <div className="agent-nav-title"><h3>WORKSPACE</h3></div><div className="agent-nav-panel">{allItems.map(button)}</div>
      <div className="agent-nav-mobile">{primary.map(button)}<button type="button" className={`agent-nav-item agent-nav-more${moreOpen || moreActive ? ' is-active' : ''}`} aria-current={moreActive ? 'page' : undefined} aria-expanded={moreOpen} aria-controls="buyer-nav-drawer" onClick={() => setMoreOpen((open) => !open)}><Menu className="agent-nav-item__icon" size={22} aria-hidden="true"/><span className="agent-nav-item__label">More</span></button></div>
    </nav>
  );
  return <>
    {usePortal ? createPortal(navigation, document.body) : navigation}
    {moreOpen && createPortal(<>
      <button type="button" className="agent-nav-backdrop buyer-nav-backdrop" aria-label="Close more navigation" onClick={() => setMoreOpen(false)} />
      <div className="agent-nav-drawer buyer-nav-drawer" id="buyer-nav-drawer" role="dialog" aria-modal="true" aria-label="More pages"><div className="agent-nav-drawer__heading">More pages<button type="button" aria-label="Close menu" onClick={() => setMoreOpen(false)}><X size={18}/></button></div>{allItems.slice(3).map(button)}</div>
    </>, document.body)}
  </>;
}
