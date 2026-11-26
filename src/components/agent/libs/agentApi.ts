import { getStaffToken, setStaffToken } from '../../../shared/maps/listingsApi.js';
import { subscribeToChatEvents as subscribeToEvents } from '../../../shared/chatEvents.js';

const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

export interface AgentProfile { name: string; credential: string; city: string; verified: boolean; email?: string }
export interface AgentActivity { id: string; eventType: string; entityType: string; entityId: string; summary: string; createdAt: string }
export interface AgentInquiry { id: string; listingId: string; buyerId: string; buyerName: string; buyerEmail: string; listingTitle: string; subject: string; status: 'new' | 'read'; createdAt: string; updatedAt: string; lastMessage: string | null }
export interface AgentMessage { id: string; senderType: 'agent' | 'buyer'; senderId: string; body: string; createdAt: string; cursorCreatedAt: string; offer?: null | { id: string; kind: 'offer' | 'counteroffer'; amount: number | string; status: 'pending' | 'countered' | 'accepted' | 'declined'; note: string } }
export interface AgentSlot { id: string; listingId: string; listingTitle: string; startsAt: string; endsAt: string; status: 'available' | 'pending' | 'confirmed' }
export interface AgentAppointment { id: string; status: 'pending' | 'confirmed' | 'declined'; buyerNote: string; agentNote: string; createdAt: string; slotId: string; startsAt: string; endsAt: string; listingId: string; listingTitle: string; buyerId: string; buyerName: string; buyerEmail: string }
export interface AgentNotification { id: string; eventType: string; title: string; body: string; entityType: string; entityId: string; createdAt: string; readAt: string | null }
export interface AgentDashboard { listings: { total: number; byStatus: Record<string, number> }; inquiries: { total: number; unread: number }; appointments: { pending: number; upcoming: number }; recentActivity: AgentActivity[] }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  const token = getStaffToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) {
    setStaffToken(null);
    window.dispatchEvent(new Event('homelane:session-expired'));
  }
  if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status}).`);
  return payload as T;
}

async function getAllPages<T>(path: string, collection: 'inquiries' | 'messages' | 'slots' | 'appointments' | 'notifications'): Promise<T[]> {
  const items: T[] = [];
  let offset = 0;
  while (true) {
    const page = await request<Record<typeof collection, T[]> & { pagination: { limit: number; hasMore: boolean } }>(`${path}${path.includes('?') ? '&' : '?'}limit=100&offset=${offset}`);
    items.push(...page[collection]);
    if (!page.pagination?.hasMore) return items;
    offset += page.pagination.limit;
  }
}

export const getAgentDashboard = async () => (await request<{ dashboard: AgentDashboard }>('/staff/dashboard')).dashboard;
export const getAgentProfile = async () => (await request<{ profile: AgentProfile }>('/staff/profile')).profile;
export const saveAgentProfile = async (profile: Pick<AgentProfile, 'name' | 'credential' | 'city'>) => (await request<{ profile: AgentProfile }>('/staff/profile', { method: 'PUT', body: JSON.stringify(profile) })).profile;
export const getAgentInquiries = async () => getAllPages<AgentInquiry>('/staff/inquiries', 'inquiries');
export const markAgentInquiryRead = async (id: string) => (await request<{ inquiry: { id: string; status: 'read' } }>(`/staff/inquiries/${encodeURIComponent(id)}/read`, { method: 'PATCH' })).inquiry;
export const getAgentMessages = async (id: string) => getAllPages<AgentMessage>(`/staff/inquiries/${encodeURIComponent(id)}/messages`, 'messages');
export const getAgentMessagesAfter = async (inquiryId: string, afterCreatedAt: string, afterId: string) => {
  const messages: AgentMessage[] = [];
  let cursorCreatedAt = afterCreatedAt;
  let cursorId = afterId;
  while (true) {
    const query = new URLSearchParams({ afterCreatedAt: cursorCreatedAt, afterId: cursorId, limit: '100' });
    const page = await request<{ messages: AgentMessage[]; pagination: { hasMore: boolean } }>(`/staff/inquiries/${encodeURIComponent(inquiryId)}/messages/after?${query}`);
    messages.push(...page.messages);
    if (!page.pagination.hasMore || !page.messages.length) return messages;
    const last = page.messages[page.messages.length - 1]!;
    cursorCreatedAt = last.cursorCreatedAt;
    cursorId = last.id;
  }
};
export const sendAgentMessage = async (id: string, body: string, clientMessageId?: string) => (await request<{ message: AgentMessage }>(`/staff/inquiries/${encodeURIComponent(id)}/messages`, { method: 'POST', body: JSON.stringify({ body, clientMessageId }) })).message;
export const subscribeToAgentChatEvents = (onMessage: (event: { id: string; inquiryId: string }) => void, onReconnect: () => void) => subscribeToEvents(`${API_URL}/staff/chat/events`, getStaffToken, onMessage, onReconnect, () => { setStaffToken(null); window.dispatchEvent(new Event('homelane:session-expired')); });
export const sendAgentOffer = async (id: string, amount: number, note = '') => (await request<{ message: AgentMessage }>(`/staff/inquiries/${encodeURIComponent(id)}/offers`, { method: 'POST', body: JSON.stringify({ amount, note }) })).message;
export const respondToAgentOffer = async (id: string, status: 'accepted' | 'declined') => (await request<{ offer: { id: string; status: 'accepted' | 'declined' } }>(`/staff/offers/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status }) })).offer;
export const getAgentSlots = async () => getAllPages<AgentSlot>('/staff/viewing-slots', 'slots');
export const createAgentSlot = async (input: { listingId: string; startsAt: string; endsAt: string }) => (await request<{ slot: AgentSlot }>('/staff/viewing-slots', { method: 'POST', body: JSON.stringify(input) })).slot;
export const deleteAgentSlot = async (id: string) => request<{ ok: boolean }>(`/staff/viewing-slots/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const getAgentAppointments = async () => getAllPages<AgentAppointment>('/staff/appointments', 'appointments');
export const updateAgentAppointment = async (id: string, status: 'confirmed' | 'declined', agentNote = '') => (await request<{ appointment: { id: string; status: AgentAppointment['status']; startsAt: string } }>(`/staff/appointments/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status, agentNote }) })).appointment;
export const getAgentActivity = async (limit = 20, offset = 0) => request<{ activity: AgentActivity[]; pagination: { limit: number; offset: number; total: number; hasMore: boolean } }>(`/staff/activity?limit=${limit}&offset=${offset}`);
export const getAgentNotifications = async () => getAllPages<AgentNotification>('/account/notifications', 'notifications');
export const markAgentNotificationRead = async (id: string) => (await request<{ notification: { id: string; readAt: string } }>(`/account/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' })).notification;
export const markAllAgentNotificationsRead = async () => (await request<{ updated: number }>('/account/notifications/read-all', { method: 'PATCH' })).updated;
