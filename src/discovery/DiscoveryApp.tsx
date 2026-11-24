import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import DiscoveryHeader from './shared/DiscoveryHeader.js';
import DiscoveryNavigation, { type DiscoveryScreen } from './shared/DiscoveryNavigation.js';
import StateMessage from './shared/StateMessage.js';
import useDiscoveryNavigate from './shared/useDiscoveryNavigate.js';
import { clearBuyerSession, getBuyerToken } from './buyerApi.js';
import './discovery.css';
import '../components/agent/shared/sharedStyles.css';

function screenFromPath(path: string): DiscoveryScreen {
  if (/\/properties\/[^/]+\/?$/.test(path)) return 'properties';
  const match = ['home', 'map', 'viewings', 'properties', 'messages', 'notifications', 'profile'].find((screen) => path.endsWith(`/${screen}`));
  return (match as DiscoveryScreen | undefined) ?? 'map';
}

// Buyers land on the workspace home after sign-in.
export function DiscoveryIndexRedirect() {
  return <Navigate to="home" replace />;
}

// Home and Properties are built by other teammates. These stay clickable until their pages are connected.
export function DiscoveryPlaceholder({ title }: { title: string }) {
  return (
    <main className="discovery-page">
      <StateMessage title={title} text="This page is built by another teammate and will be connected through the shared router." />
    </main>
  );
}

// Layout for every /discovery page: header on top, the routed page in the middle, navigation at the bottom.
export default function DiscoveryApp() {
  const location = useLocation();
  const navigateTo = useNavigate();
  const navigate = useDiscoveryNavigate();
  const screen = screenFromPath(location.pathname);

  useEffect(() => {
    if (!getBuyerToken()) navigateTo('/auth/login?mode=login', { replace: true, state: { from: location.pathname + location.search } });
  }, [location.pathname, location.search, navigateTo]);

  useEffect(() => {
    const expired = () => { clearBuyerSession(); navigateTo('/auth/login?mode=login', { replace: true }); };
    window.addEventListener('homelane:buyer-session-expired', expired);
    return () => window.removeEventListener('homelane:buyer-session-expired', expired);
  }, [navigateTo]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  if (!getBuyerToken()) return <Navigate to="/auth/login?mode=login" replace state={{ from: location.pathname + location.search }} />;

  return (
    <div className={`agent-app discovery-app${screen === 'map' ? ' agent-app--map' : ''}`}>
      {screen !== 'map' && <DiscoveryHeader onNavigate={navigate} />}
      <Outlet />
      {screen !== 'map' && <DiscoveryNavigation screen={screen} onNavigate={navigate} />}
    </div>
  );
}
