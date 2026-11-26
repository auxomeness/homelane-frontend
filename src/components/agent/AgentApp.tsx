import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import { AgentDataProvider } from './libs/AgentDataContext.js';
import AgentHeader from './shared/AgentHeader.js';
import AgentNavigation, { type AgentScreen } from './shared/AgentNavigation.js';
import './shared/sharedStyles.css';
import AccountLogin from '../../shared/maps/AccountLogin.js';
import { getAccountRole, getAccountToken, isLocalAdminDev } from '../../shared/maps/listingsApi.js';

const paths: Record<AgentScreen, string> = {
  dashboard: '/agent/dashboard',
  listings: '/agent/my-listings',
  map: '/agent/map',
  addListing: '/agent/add-listings',
  viewings: '/agent/viewings',
  inquiries: '/agent/inquiries',
  messages: '/agent/messages',
  activity: '/agent/activity',
  profile: '/agent/profile',
};

function screenFromPath(path: string): AgentScreen | null {
  path = path.replace(/\/+$/, '') || '/';
  if (path.endsWith('/dashboard') || path === '/agent') return 'dashboard';
  if (path.endsWith('/my-listings')) return 'listings';
  if (path.endsWith('/map')) return 'map';
  if (path.endsWith('/add-listings')) return 'addListing';
  if (path.endsWith('/viewings')) return 'viewings';
  if (path.endsWith('/inquiries')) return 'inquiries';
  if (path.endsWith('/messages')) return 'messages';
  if (path.endsWith('/activity')) return 'activity';
  if (path.endsWith('/profile')) return 'profile';
  return null;
}

function AgentIndexRedirect() {
  return <Navigate to="dashboard" replace />;
}

export { AgentIndexRedirect };

export default function AgentApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const screen = screenFromPath(location.pathname);
  const [sessionVersion, setSessionVersion] = useState(0);

  useEffect(() => {
    const refreshSession = () => setSessionVersion((version) => version + 1);
    window.addEventListener('homelane:session-expired', refreshSession);
    return () => window.removeEventListener('homelane:session-expired', refreshSession);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  if (!isLocalAdminDev() && (!getAccountToken() || getAccountRole() !== 'agent')) return <AccountLogin key={sessionVersion} role="agent" />;
  return (
    <AgentDataProvider>
      <div className={`agent-app${location.pathname === '/agent/map' ? ' agent-app--map' : ''}`}>
        <AgentHeader />
        <AgentNavigation screen={screen} onNavigate={(next) => navigate(paths[next])} />
        <Outlet />
      </div>
    </AgentDataProvider>
  );
}
