import type { PropertyListing } from '../shared/maps/listingsApi.js';

const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const TOKEN_KEY = 'homelane.buyer-token.v1';

export interface BuyerProfile { id: string; name: string; email: string; createdAt?: string }
export interface BuyerInquiry { id: string; listingId: string; agentId: string; status: string; createdAt: string; updatedAt: string; listingTitle: string; agentName: string; lastMessage: string | null; unread: number }
export interface BuyerMessage { id: string; senderType: 'buyer' | 'agent'; senderId: string; body: string; createdAt: string; offer: null | { id: string; kind: 'offer' | 'counteroffer'; amount: number | string; status: 'pending' | 'countered' | 'accepted' | 'declined'; note: string } }
export interface BuyerAppointment { id: string; status: 'pending' | 'confirmed' | 'declined'; buyerNote: string; agentNote: string; createdAt: string; slotId: string; startsAt: string; endsAt: string; listingId: string; listingTitle: string; agentName: string }
export interface BuyerOffer { id: string; inquiryId: string; listingId: string; listingTitle: string; agentName: string; senderType: 'buyer' | 'agent'; kind: 'offer' | 'counteroffer'; amount: number | string; status: 'pending' | 'countered' | 'accepted' | 'declined'; note: string; createdAt: string }
export interface AccountNotification { id: string; eventType: string; title: string; body: string; entityType: string; entityId: string; createdAt: string; readAt: string | null }
export interface ViewingSlot { id: string; listingId: string; startsAt: string; endsAt: string }
export type SavedListing = Pick<PropertyListing, 'id' | 'title' | 'location' | 'price' | 'propertyType' | 'description' | 'photos' | 'bedrooms' | 'bathrooms' | 'floorArea' | 'latitude' | 'longitude'> & { savedAt: string };

export function getBuyerToken() { return sessionStorage.getItem(TOKEN_KEY); }
export function clearBuyerSession() { sessionStorage.removeItem(TOKEN_KEY); }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  const token = getBuyerToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) {
    clearBuyerSession();
    window.dispatchEvent(new Event('homelane:buyer-session-expired'));
  }
  if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status}).`);
  return payload as T;
}

async function allPages<T>(path: string, key: string): Promise<T[]> {
  const items: T[] = [];
  let offset = 0;
  while (true) {
    // Let the API use its default page size; this also works with older deployed API
    // instances whose maximum page size may be lower than this client expects.
    const url = offset === 0 ? path : `${path}${path.includes('?') ? '&' : '?'}offset=${offset}`;
    const page = await request<Record<string, T[]> & { pagination: { limit: number; hasMore: boolean } }>(url);
    items.push(...(page[key] ?? []));
    if (!page.pagination?.hasMore) return items;
    const pageSize = Number(page.pagination.limit);
    if (!Number.isSafeInteger(pageSize) || pageSize < 1) throw new Error('The service returned invalid pagination data.');
    offset += pageSize;
  }
}

export const getBuyerProfile = async () => (await request<{ user: BuyerProfile }>('/buyer/profile')).user;
export const updateBuyerProfile = async (profile: Pick<BuyerProfile, 'name' | 'email'>) => (await request<{ user: BuyerProfile }>('/buyer/profile', { method: 'PUT', body: JSON.stringify(profile) })).user;
export const getBuyerInquiries = () => allPages<BuyerInquiry>('/buyer/inquiries', 'inquiries');
export const getBuyerMessages = (id: string) => allPages<BuyerMessage>(`/buyer/inquiries/${encodeURIComponent(id)}/messages`, 'messages');
// The backend's inquiry validator calls the initial message `message`.
export const createBuyerInquiry = async (listingId: string, message: string) => request<{ inquiry: { id: string; listingId: string }; message: BuyerMessage }>('/buyer/inquiries', { method: 'POST', body: JSON.stringify({ listingId, message }) });
export const markBuyerInquiryRead = async (id: string) => (await request<{ inquiry: { id: string; read: boolean } }>(`/buyer/inquiries/${encodeURIComponent(id)}/read`, { method: 'PATCH' })).inquiry;
export const sendBuyerMessage = async (id: string, body: string) => (await request<{ message: BuyerMessage }>(`/buyer/inquiries/${encodeURIComponent(id)}/messages`, { method: 'POST', body: JSON.stringify({ body }) })).message;
export const sendBuyerOffer = async (id: string, amount: number, note = '') => (await request<{ message: BuyerMessage }>(`/buyer/inquiries/${encodeURIComponent(id)}/offers`, { method: 'POST', body: JSON.stringify({ amount, note }) })).message;
export const respondToBuyerOffer = async (id: string, status: 'accepted' | 'declined') => (await request<{ offer: BuyerOffer }>(`/buyer/offers/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status }) })).offer;
export const getBuyerOffers = () => allPages<BuyerOffer>('/buyer/offers', 'offers');
export const getBuyerAppointments = () => allPages<BuyerAppointment>('/buyer/appointments', 'appointments');
export const getBuyerSlots = (listingId: string) => request<{ slots: ViewingSlot[] }>(`/listings/${encodeURIComponent(listingId)}/viewing-slots?limit=100&offset=0`).then((result) => result.slots);
export const bookBuyerAppointment = async (slotId: string, note = '') => (await request<{ appointment: BuyerAppointment }>('/buyer/appointments', { method: 'POST', body: JSON.stringify({ slotId, note }) })).appointment;
export const getBuyerNotifications = () => allPages<AccountNotification>('/account/notifications', 'notifications');
export const markBuyerNotificationRead = async (id: string) => (await request<{ notification: AccountNotification }>(`/account/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' })).notification;
export const getSavedListings = () => allPages<SavedListing>('/buyer/saved-listings', 'listings');
export const saveListing = async (id: string) => request<{ saved: { listingId: string } }>(`/buyer/saved-listings/${encodeURIComponent(id)}`, { method: 'POST' });
export const unsaveListing = async (id: string) => request<{ ok: boolean }>(`/buyer/saved-listings/${encodeURIComponent(id)}`, { method: 'DELETE' });
