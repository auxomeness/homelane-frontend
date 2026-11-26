import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import AccountLogin from './AccountLogin.js';
import { getAccountRole, getAccountToken, setAccountToken } from './listingsApi.js';

export default function RoleGate({ role }: { role: 'agent' | 'admin' }) {
  // const [, refreshSession] = useState(0);
  // useEffect(() => {
  //   const onSessionChanged = () => refreshSession((version) => version + 1);
  //   window.addEventListener('homelane:session-changed', onSessionChanged);
  //   return () => window.removeEventListener('homelane:session-changed', onSessionChanged);
  // }, []);

  // if (!getAccountToken() || getAccountRole() !== role) { 
  //   if (getAccountRole() !== role) {
  //     setAccountToken(null)
  //   }; 
    
  //   return <AccountLogin role={role} />; 
  // }
  return <Outlet />;
}
