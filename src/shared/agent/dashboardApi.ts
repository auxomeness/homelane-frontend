import { getAccountToken, handleExpiredSession, type ListingStatus } from '../maps/listingsApi.js';

export interface AgentDashboardData {
  profile: { name: string; credential: string; city: string; verified: boolean };
  counts: {
    managedProperties: number;
    activeListings: number;
    pendingReview: number;
    needsAttention: number;
    activeTotalValue: number;
  };
  recentListings: {
    id: string;
    title: string;
    location: string;
    price: number;
    status: ListingStatus;
  }[];
}

const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

export async function getAgentDashboard(): Promise<AgentDashboardData> {
  const token = getAccountToken();
  if (!token) throw new Error('Sign in to continue.');
  const response = await fetch(API_URL + '/agent/dashboard', {
    headers: { Authorization: 'Bearer ' + token },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    handleExpiredSession(response.status);
    throw new Error(payload.error ?? 'Unable to load dashboard.');
  }
  return payload as AgentDashboardData;
}
