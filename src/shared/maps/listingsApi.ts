export type ListingStatus = 'draft' | 'pending' | 'active' | 'rejected';
export interface PropertyListing {
  id: string; title: string; location: string; price: number; propertyType: string; description: string; photos: string[];
  bedrooms: number | null; bathrooms: number | null; floorArea: number | null; latitude: number; longitude: number;
  status: ListingStatus; createdAt: string; updatedAt: string;
}
export interface AdminListing extends PropertyListing { agent: { id: string; email: string } }
export interface ListingInput { title: string; location: string; price: number; propertyType: string; description: string; photos: string[]; bedrooms?: number | null; bathrooms?: number | null; floorArea?: number | null; latitude: number; longitude: number; status: ListingStatus }
export interface AccountSession { token: string; user: { email: string; role: 'admin' | 'agent' } }
export interface AdminListingsPage { listings: PropertyListing[]; page: number; pageSize: number; total: number }
export interface AdminListingsFilters { status?: ListingStatus | 'all'; q?: string; page?: number; pageSize?: number }

const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const TOKEN_KEY = 'homelane.account-token.v1';
const ROLE_KEY = 'homelane.account-role.v1';
export const getAccountToken = () => sessionStorage.getItem(TOKEN_KEY);
export const getAccountRole = () => sessionStorage.getItem(ROLE_KEY);
export const setAccountToken = (token: string | null, role?: 'agent' | 'admin') => {
  if (token) { sessionStorage.setItem(TOKEN_KEY, token); if (role) sessionStorage.setItem(ROLE_KEY, role); }
  else { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(ROLE_KEY); }
};
export function handleExpiredSession(status: number) {
  if (status === 401 && getAccountToken()) {
    setAccountToken(null);
    window.location.reload();
  }
}
async function request<T>(path: string, init: RequestInit = {}, authenticated = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  const token = getAccountToken();
  if (authenticated) {
    if (!token) throw new Error('Sign in to continue.');
    headers.set('Authorization', 'Bearer ' + token);
  }
  const response = await fetch(API_URL + path, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (authenticated) handleExpiredSession(response.status);
    throw new Error(payload.error ?? 'Request failed (' + response.status + ').');
  }
  return payload as T;
}
export const loginAccount = async (email: string, password: string) => {
  const session = await request<AccountSession>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  setAccountToken(session.token, session.user.role);
  return session.user;
};
export const getPublicListings = async () => (await request<{ listings: PropertyListing[] }>('/listings')).listings;
export const getAgentListings = async () => (await request<{ listings: PropertyListing[] }>('/agent/listings', {}, true)).listings;
export const getAdminListingsPage = async (filters: AdminListingsFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.status !== undefined) params.set('status', filters.status);
  if (filters.q !== undefined) params.set('q', filters.q);
  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.pageSize !== undefined) params.set('pageSize', String(filters.pageSize));
  const query = params.size ? '?' + params : '';
  return request<AdminListingsPage>('/admin/listings' + query, {}, true);
};
export const getAdminListings = async (filters: Omit<AdminListingsFilters, 'page' | 'pageSize'> = {}) => {
  const listings: PropertyListing[] = [];
  for (let page = 1; ; page += 1) {
    const result = await getAdminListingsPage({ ...filters, page, pageSize: 100 });
    listings.push(...result.listings);
    if (listings.length >= result.total || result.listings.length === 0) return listings;
  }
};
export const getAdminListing = async (id: string) =>
  (await request<{ listing: AdminListing }>('/admin/listings/' + encodeURIComponent(id), {}, true)).listing;
export const createAdminListing = async (listing: Omit<ListingInput, 'status'>) =>
  (await request<{ listing: PropertyListing }>('/admin/listings', { method: 'POST', body: JSON.stringify(listing) }, true)).listing;
export const createListing = async (listing: ListingInput) =>
  (await request<{ listing: PropertyListing }>('/agent/listings', { method: 'POST', body: JSON.stringify(listing) }, true)).listing;
export const updateListing = async (id: string, listing: ListingInput) =>
  (await request<{ listing: PropertyListing }>('/agent/listings/' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(listing) }, true)).listing;
export const reviewListing = async (id: string, status: ListingStatus, latitude: number, longitude: number) =>
  (await request<{ listing: PropertyListing }>('/admin/listings/' + encodeURIComponent(id) + '/status', { method: 'PATCH', body: JSON.stringify({ status, latitude, longitude }) }, true)).listing;
export const deleteListing = async (id: string) =>
  request<{ ok: boolean }>('/agent/listings/' + encodeURIComponent(id), { method: 'DELETE' }, true);

declare global { interface ImportMetaEnv { readonly VITE_API_URL?: string } }
