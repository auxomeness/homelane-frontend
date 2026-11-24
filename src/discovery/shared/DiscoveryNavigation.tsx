import { useState } from 'react';
import { Home, Map, CalendarDays, Building2, MessageCircle, Bell, UserRound, MoreHorizontal, X } from 'lucide-react';
import type { DiscoveryScreen } from './discoveryRoutes.js';
export type { DiscoveryScreen } from './discoveryRoutes.js';
interface DiscoveryNavigationProps { screen: DiscoveryScreen; onNavigate: (screen: DiscoveryScreen) => void }
const allItems: Array<{ id: DiscoveryScreen; label: string; icon: typeof Home }> = [
  { id: 'home', label: 'Home', icon: Home }, { id: 'properties', label: 'Properties', icon: Building2 }, { id: 'map', label: 'Map', icon: Map },
  { id: 'viewings', label: 'Viewings', icon: CalendarDays }, { id: 'messages', label: 'Messages', icon: MessageCircle }, { id: 'notifications', label: 'Notifications', icon: Bell }, { id: 'profile', label: 'Profile', icon: UserRound },
];
export default function DiscoveryNavigation({ screen, onNavigate }: DiscoveryNavigationProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = allItems.slice(0, 3); const active = screen === 'messages' || screen === 'notifications' || screen === 'profile' ? 'more' : screen;
  const button = (item: typeof allItems[number]) => { const Icon = item.icon; return <button key={item.id} type="button" className={`agent-nav-item${screen === item.id ? ' is-active' : ''}`} aria-current={screen === item.id ? 'page' : undefined} onClick={() => { setMoreOpen(false); onNavigate(item.id); }}><Icon size={22}/><span className="agent-nav-item__label">{item.label}</span></button>; };
  return <>
    <nav id="agent-nav" className="discovery-agent-nav" aria-label="Buyer workspace navigation">
      <div className="agent-nav-title"><h3>WORKSPACE</h3></div><div className="agent-nav-panel">{allItems.map(button)}</div>
      <div className="agent-nav-mobile">{primary.map(button)}<button type="button" className={`agent-nav-item${active === 'more' ? ' is-active' : ''}`} aria-expanded={moreOpen} onClick={() => setMoreOpen((open) => !open)}><MoreHorizontal size={22}/><span className="agent-nav-item__label">More</span></button></div>
    </nav>
    {moreOpen && <><button className="agent-nav-backdrop" aria-label="Close more navigation" onClick={() => setMoreOpen(false)}/><div className="agent-nav-drawer" role="dialog" aria-label="More pages"><div className="agent-nav-drawer__heading">More pages<button type="button" aria-label="Close menu" onClick={() => setMoreOpen(false)}><X size={18}/></button></div>{allItems.slice(3).map(button)}</div></>}
  </>;
}
