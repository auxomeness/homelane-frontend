import { Outlet } from 'react-router';
import StaffLogin from './StaffLogin.js';
import { getStaffRole, getStaffToken, isLocalAdminDev, setStaffToken } from './listingsApi.js';

export default function StaffGate({ role }: { role: 'agent' | 'admin' }) {
  if (isLocalAdminDev()) return <Outlet />;
  if (!getStaffToken() || getStaffRole() !== role) { 
    if (getStaffRole() !== role) {
      setStaffToken(null)
    }; 
    
    return <StaffLogin role={role} />; 
  }
  return <Outlet />;
}
