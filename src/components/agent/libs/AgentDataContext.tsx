import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createListing as createListingRequest, deleteListing as deleteListingRequest, getStaffListings, updateListing as updateListingRequest, type ListingInput, type StaffPropertyListing } from '../../../shared/maps/listingsApi.js';
import * as api from './agentApi.js';
import type { AgentListingData, AgentListingStatus } from './listData.js';
import { resolveUpdatedListingStatus } from './listingWorkflow.js';

export type AgentInquiry = api.AgentInquiry & { name: string; property: string; message: string; time: string };
export type AgentProfile = api.AgentProfile;
type ListingDraft = Omit<ListingInput, 'status'>;
interface AgentWorkspaceData {
  listings: AgentListingData[]; inquiries: AgentInquiry[]; profile: AgentProfile;
  dashboard: api.AgentDashboard | null; appointments: api.AgentAppointment[]; slots: api.AgentSlot[];
  activity: api.AgentActivity[]; notifications: api.AgentNotification[]; conversations: Record<string, api.AgentMessage[]>;
  activityHasMore: boolean;
}
interface AgentDataValue extends AgentWorkspaceData {
  loading: boolean; error: string; reload: () => Promise<void>;
  createListing: (draft: ListingDraft, submitForReview: boolean) => Promise<void>;
  updateListing: (id: string, draft: ListingDraft, submitForReview?: boolean) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;
  updateProfile: (profile: AgentProfile) => Promise<void>;
  markInquiryRead: (id: string) => Promise<void>; loadConversation: (id: string) => Promise<void>; syncConversation: (id: string) => Promise<void>;
  replyToInquiry: (id: string, message: string, clientMessageId?: string) => Promise<void>;
  offerToInquiry: (id: string, amount: number, note: string) => Promise<void>;
  respondToOffer: (id: string, status: 'accepted' | 'declined') => Promise<void>;
  createSlot: (slot: { listingId: string; startsAt: string; endsAt: string }) => Promise<void>;
  deleteSlot: (id: string) => Promise<void>; updateAppointment: (id: string, status: 'confirmed' | 'declined', note?: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  loadMoreActivity: () => Promise<void>;
}
const statusText = (status: AgentListingStatus) => ({ status, statusLabel: status === 'draft' ? 'Draft' : status === 'pending' ? 'Pending review' : status === 'rejected' ? 'Action required' : 'Active / Live', actionLabel: status === 'draft' || status === 'rejected' ? 'Edit listing' : 'View listing' });
function adaptListing(listing: StaffPropertyListing): AgentListingData {
  return { ...listing, latitude: listing.latitude ?? undefined, longitude: listing.longitude ?? undefined, bedrooms: listing.bedrooms ?? undefined, bathrooms: listing.bathrooms ?? undefined, floorArea: listing.floorArea ?? undefined, price: `₱ ${Number(listing.price).toLocaleString('en-PH')}`, ...statusText(listing.status) };
}
function adaptInquiry(inquiry: api.AgentInquiry): AgentInquiry {
  return { ...inquiry, name: inquiry.buyerName, property: inquiry.listingTitle, message: inquiry.lastMessage ?? inquiry.subject ?? 'New inquiry', time: new Date(inquiry.updatedAt).toLocaleString() };
}

const emptyProfile: AgentProfile = { name: '', credential: '', city: '', verified: false };
const AgentDataContext = createContext<AgentDataValue | null>(null);

export function AgentDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AgentWorkspaceData>({ listings: [], inquiries: [], profile: emptyProfile, dashboard: null, appointments: [], slots: [], activity: [], activityHasMore: false, notifications: [], conversations: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [listings, dashboard, profile, inquiries, appointments, slots, activityResult, notifications] = await Promise.all([
        getStaffListings(), api.getAgentDashboard(), api.getAgentProfile(), api.getAgentInquiries(), api.getAgentAppointments(), api.getAgentSlots(), api.getAgentActivity(20), api.getAgentNotifications(),
      ]);
      setData((current) => ({ ...current, listings: listings.map(adaptListing), dashboard, profile, inquiries: inquiries.map(adaptInquiry), appointments, slots, activity: activityResult.activity, activityHasMore: activityResult.pagination.hasMore, notifications }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load agent workspace.');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);

  const value = useMemo<AgentDataValue>(() => ({
    ...data, loading, error, reload,
    createListing: async (draft, submit) => { await createListingRequest({ ...draft, status: submit ? 'pending' : 'draft' }); await reload(); },
    updateListing: async (id, draft, submit = false) => { const current = data.listings.find((listing) => listing.id === id); await updateListingRequest(id, { ...draft, status: resolveUpdatedListingStatus(current?.status, submit) }); await reload(); },
    deleteListing: async (id) => { await deleteListingRequest(id); await reload(); },
    updateProfile: async (profile) => { const saved = await api.saveAgentProfile(profile); setData((current) => ({ ...current, profile: saved })); },
    markInquiryRead: async (id) => { await api.markAgentInquiryRead(id); setData((current) => ({ ...current, inquiries: current.inquiries.map((item) => item.id === id ? { ...item, status: 'read' } : item) })); },
    loadConversation: async (id) => { const messages = await api.getAgentMessages(id); setData((current) => ({ ...current, conversations: { ...current.conversations, [id]: [...new Map([...(current.conversations[id] ?? []), ...messages].map((message) => [message.id, message])).values()] } })); },
    syncConversation: async (id) => { const current = data.conversations[id] ?? []; const last = current[current.length - 1]; const messages = last ? await api.getAgentMessagesAfter(id, last.cursorCreatedAt, last.id) : await api.getAgentMessages(id); if (messages.length) setData((state) => ({ ...state, conversations: { ...state.conversations, [id]: [...new Map([...(state.conversations[id] ?? []), ...messages].map((message) => [message.id, message])).values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)) } })); },
    replyToInquiry: async (id, message, clientMessageId) => { const sent = await api.sendAgentMessage(id, message, clientMessageId); setData((current) => ({ ...current, conversations: { ...current.conversations, [id]: [...new Map([...(current.conversations[id] ?? []), sent].map((item) => [item.id, item])).values()] }, inquiries: current.inquiries.map((item) => item.id === id ? { ...item, status: 'read', message } : item) })); await reload(); },
    offerToInquiry: async (id, amount, note) => { await api.sendAgentOffer(id, amount, note); const messages = await api.getAgentMessages(id); setData((current) => ({ ...current, conversations: { ...current.conversations, [id]: messages } })); await reload(); },
    respondToOffer: async (id, status) => { await api.respondToAgentOffer(id, status); const inquiryId = Object.entries(data.conversations).find(([, messages]) => messages.some((message) => message.offer?.id === id))?.[0]; if (inquiryId) { const messages = await api.getAgentMessages(inquiryId); setData((current) => ({ ...current, conversations: { ...current.conversations, [inquiryId]: messages } })); } await reload(); },
    createSlot: async (slot) => { await api.createAgentSlot(slot); await reload(); },
    deleteSlot: async (id) => { await api.deleteAgentSlot(id); await reload(); },
    updateAppointment: async (id, status, note) => { await api.updateAgentAppointment(id, status, note); await reload(); },
    markNotificationRead: async (id) => { const result = await api.markAgentNotificationRead(id); setData((current) => ({ ...current, notifications: current.notifications.map((item) => item.id === id ? { ...item, readAt: result.readAt } : item) })); },
    markAllNotificationsRead: async () => { await api.markAllAgentNotificationsRead(); const now = new Date().toISOString(); setData((current) => ({ ...current, notifications: current.notifications.map((item) => item.readAt ? item : { ...item, readAt: now }) })); },
    loadMoreActivity: async () => { const result = await api.getAgentActivity(20, data.activity.length); setData((current) => ({ ...current, activity: [...current.activity, ...result.activity], activityHasMore: result.pagination.hasMore })); },
  }), [data, loading, error, reload]);
  return <AgentDataContext.Provider value={value}>{children}</AgentDataContext.Provider>;
}
export function useAgentData() { const context = useContext(AgentDataContext); if (!context) throw new Error('useAgentData must be used within AgentDataProvider'); return context; }
