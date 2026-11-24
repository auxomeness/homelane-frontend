import { getAccountToken, handleExpiredSession } from '../maps/listingsApi.js';

export interface DashboardAgentApplication {
  id: string;
  fullName: string;
  city: string;
  licenseNumber: string;
  status: 'pending';
  createdAt: string;
}

export interface DashboardListing {
  id: string;
  title: string;
  location: string;
  propertyType: string;
  status: 'pending';
  createdAt: string;
}

export interface AdminDashboardData {
  counts: {
    pendingAgentApplications: number;
    pendingListings: number;
  };
  recent: {
    agentApplications: DashboardAgentApplication[];
    listings: DashboardListing[];
  };
}

const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const token = getAccountToken();
  const response = await fetch(API_URL + '/admin/dashboard', {
    headers: token ? { Authorization: 'Bearer ' + token } : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    handleExpiredSession(response.status);
    throw new Error(payload.error ?? 'Unable to load dashboard.');
  }
  return payload as AdminDashboardData;
}
