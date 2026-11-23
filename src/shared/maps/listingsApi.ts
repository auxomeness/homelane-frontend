export type ListingStatus = 'draft' | 'pending' | 'active' | 'rejected';
export interface PropertyListing {
  id: string; title: string; location: string; price: number; propertyType: string; description: string; photos: string[];
  bedrooms: number | null; bathrooms: number | null; floorArea: number | null; latitude: number; longitude: number;
  status: ListingStatus; createdAt: string; updatedAt: string;
}
export interface StaffPropertyListing extends Omit<PropertyListing, 'latitude' | 'longitude'> { latitude: number | null; longitude: number | null }
export interface ListingInput { title: string; location: string; price: number; propertyType: string; description: string; photos: string[]; bedrooms?: number | null; bathrooms?: number | null; floorArea?: number | null; latitude?: number | null; longitude?: number | null; status: ListingStatus }
export interface StaffSession { token: string; user: { email: string; role: 'admin' | 'agent' } }

const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const TOKEN_KEY = 'homelane.staff-token.v1';
const ROLE_KEY = 'homelane.staff-role.v1';
export const isLocalAdminDev = () => import.meta.env.DEV && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
const useLocalStaffListings = () => isLocalAdminDev() && /^\/(?:admin|agent)(?:\/|$)/.test(window.location.pathname);
let localAdminListings: StaffPropertyListing[] = [
  { id: 'local-1', title: 'Three-bedroom townhome', location: 'Quezon City', price: 8500000, propertyType: 'Townhouse', description: 'Three-bedroom townhome submitted for review.', photos: [], bedrooms: 3, bathrooms: 2, floorArea: 120, latitude: 14.676, longitude: 121.0437, status: 'pending', createdAt: '2026-11-12T09:00:00.000Z', updatedAt: '2026-11-12T09:00:00.000Z' },
  { id: 'local-2', title: 'Ortigas Skyline Condo', location: 'Pasig City', price: 3200000, propertyType: 'Condo', description: 'City condo submitted for review.', photos: [], bedrooms: 1, bathrooms: 1, floorArea: 42, latitude: 14.587, longitude: 121.0615, status: 'pending', createdAt: '2026-11-13T09:00:00.000Z', updatedAt: '2026-11-13T09:00:00.000Z' },
  { id: 'local-3', title: 'Garden-view family home', location: 'San Juan', price: 11900000, propertyType: 'House', description: 'Family home awaiting a corrected map pin.', photos: [], bedrooms: 4, bathrooms: 3, floorArea: 210, latitude: 14.6019, longitude: 121.036, status: 'rejected', createdAt: '2026-11-10T09:00:00.000Z', updatedAt: '2026-11-14T09:00:00.000Z' },
  { id: 'local-4', title: 'Makati Garden Residences', location: 'Makati City', price: 9800000, propertyType: 'Condo', description: 'Published two-bedroom residence.', photos: [], bedrooms: 2, bathrooms: 2, floorArea: 86, latitude: 14.5547, longitude: 121.0244, status: 'active', createdAt: '2026-11-08T09:00:00.000Z', updatedAt: '2026-11-11T09:00:00.000Z' },
];
export const getStaffToken = () => sessionStorage.getItem(TOKEN_KEY);
export const getStaffRole = () => sessionStorage.getItem(ROLE_KEY);
export const setStaffToken = (token: string | null, role?: 'agent' | 'admin') => { if (token) { sessionStorage.setItem(TOKEN_KEY, token); if (role) sessionStorage.setItem(ROLE_KEY, role); } else { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(ROLE_KEY); } };

async function request<T>(path: string, init: RequestInit = {}, staff = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  const token = getStaffToken();
  if (staff && token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status}).`);
  return payload as T;
}

async function getAllListingPages<T>(path: string, staff = false): Promise<T[]> {
  const listings: T[] = [];
  let offset = 0;
  while (true) {
    const page = await request<{ listings: T[]; pagination: { limit: number; hasMore: boolean } }>(`${path}${path.includes('?') ? '&' : '?'}limit=100&offset=${offset}`, {}, staff);
    // A static host (or a wrong VITE_API_URL) can answer with a web page instead of the API, so check the shape first.
    if (!Array.isArray(page?.listings)) throw new Error('The listings service is not reachable.');
    listings.push(...page.listings);
    if (!page.pagination?.hasMore) return listings;
    offset += page.pagination.limit;
  }
}

export const loginStaff = async (email: string, password: string) => {
  const session = await request<StaffSession>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  setStaffToken(session.token, session.user.role);
  return session.user;
};
export const registerAgent = async (name: string, email: string, password: string) => {
  const session = await request<StaffSession>('/auth/agents/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
  setStaffToken(session.token, 'agent');
  return session.user;
};
export const getPublicListings = async () => getAllListingPages<PropertyListing>('/listings');
export const getStaffListings = async () => useLocalStaffListings() ? [...localAdminListings] : getAllListingPages<StaffPropertyListing>('/staff/listings', true);
export const createListing = async (listing: ListingInput) => {
  if (useLocalStaffListings()) {
    const now = new Date().toISOString();
    const created: StaffPropertyListing = { ...listing, id: `local-${crypto.randomUUID()}`, latitude: listing.latitude ?? null, longitude: listing.longitude ?? null, bedrooms: listing.bedrooms ?? null, bathrooms: listing.bathrooms ?? null, floorArea: listing.floorArea ?? null, createdAt: now, updatedAt: now };
    localAdminListings = [created, ...localAdminListings];
    return created;
  }
  return (await request<{ listing: PropertyListing }>('/staff/listings', { method: 'POST', body: JSON.stringify(listing) }, true)).listing;
};
export const updateListing = async (id: string, listing: ListingInput) => {
  if (useLocalStaffListings()) {
    const previous = localAdminListings.find((item) => item.id === id);
    if (!previous) throw new Error('Listing not found.');
    const updated: StaffPropertyListing = { ...previous, ...listing, latitude: listing.latitude ?? null, longitude: listing.longitude ?? null, bedrooms: listing.bedrooms ?? null, bathrooms: listing.bathrooms ?? null, floorArea: listing.floorArea ?? null, updatedAt: new Date().toISOString() };
    localAdminListings = localAdminListings.map((item) => item.id === id ? updated : item);
    return updated;
  }
  return (await request<{ listing: PropertyListing }>(`/staff/listings/${id}`, { method: 'PUT', body: JSON.stringify(listing) }, true)).listing;
};
export const reviewListing = async (id: string, status: ListingStatus, latitude: number, longitude: number) => {
  if (useLocalStaffListings()) {
    const listing = localAdminListings.find((item) => item.id === id);
    if (!listing) throw new Error('Listing not found.');
    const updated = { ...listing, status, latitude, longitude, updatedAt: new Date().toISOString() };
    localAdminListings = localAdminListings.map((item) => item.id === id ? updated : item);
    return updated;
  }
  return (await request<{ listing: PropertyListing }>(`/staff/listings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, latitude, longitude }) }, true)).listing;
};
export const deleteListing = async (id: string) => {
  if (useLocalStaffListings()) {
    if (!localAdminListings.some((item) => item.id === id)) throw new Error('Listing not found.');
    localAdminListings = localAdminListings.filter((item) => item.id !== id);
    return { ok: true };
  }
  return request<{ ok: boolean }>(`/staff/listings/${id}`, { method: 'DELETE' }, true);
};

declare global { interface ImportMetaEnv { readonly VITE_API_URL?: string } }
