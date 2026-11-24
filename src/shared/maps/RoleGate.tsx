import { Outlet } from 'react-router';
import AccountLogin from './AccountLogin.js';
import { getAccountRole, getAccountToken, setAccountToken } from './listingsApi.js';

export default function RoleGate({ role }: { role: 'agent' | 'admin' }) {
  if (!getAccountToken() || getAccountRole() !== role) { 
    if (getAccountRole() !== role) {
      setAccountToken(null)
    }; 
    
    return <AccountLogin role={role} />; 
  }
  return <Outlet />;
}
