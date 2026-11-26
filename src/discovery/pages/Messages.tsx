import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import Button from '../../components/button.js';
import { getPublicListings, type PropertyListing } from '../../shared/maps/listingsApi.js';
import { getBuyerInquiries, getBuyerMessages, getBuyerMessagesAfter, getBuyerProfile, markBuyerInquiryRead, respondToBuyerOffer, sendBuyerMessage, sendBuyerOffer, subscribeToBuyerChatEvents, type BuyerMessage } from '../buyerApi.js';
import type { ChatMessage, Conversation, OfferStatus, Property } from '../types.js';
import StateMessage from '../shared/StateMessage.js';
import useDiscoveryNavigate from '../shared/useDiscoveryNavigate.js';
import ConversationList from './messages/ConversationList.js';
import ConversationView from './messages/ConversationView.js';

const fmtTime = (time?: string | null) => time ? new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(time)) : '';
const offerStatus = (value: string): OfferStatus => value === 'accepted' ? 'Accepted' : value === 'declined' ? 'Declined' : value === 'countered' ? 'Countered' : 'Pending';
const toChatMessage = (message: BuyerMessage): ChatMessage => ({ id: message.id, senderId: message.senderId, text: message.body, time: fmtTime(message.createdAt), createdAt: message.createdAt, cursorCreatedAt: message.cursorCreatedAt, offer: message.offer ? { id: message.offer.id, kind: message.offer.kind, amount: Number(message.offer.amount), status: offerStatus(message.offer.status), note: message.offer.note } : undefined });
const toProperty = (listing: PropertyListing): Property => ({ id: listing.id, title: listing.title, area: listing.location, type: listing.propertyType as Property['type'], price: Number(listing.price), bedrooms: listing.bedrooms ?? 0, bathrooms: listing.bathrooms ?? 0, floorArea: listing.floorArea ?? 0, pinX: 50, pinY: 50 });

export default function Messages() {
  const [searchParams] = useSearchParams();
  const onNavigate = useDiscoveryNavigate();
  const [properties, setProperties] = useState<Property[]>([]); const [buyerId, setBuyerId] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]); const [activeId, setActiveId] = useState<string | null>(null); const [filter, setFilter] = useState<'All' | 'Unread'>('All');
  const [loading, setLoading] = useState(true); const [loadingMessages, setLoadingMessages] = useState(false); const [error, setError] = useState('');
  const conversationRequest = useRef(0);
  const messageCursors = useRef(new Map<string, { createdAt: string; id: string }>());
  const autoOpened = useRef('');
  const refreshInquiries = useCallback(async () => {
    const rows = await getBuyerInquiries();
    setConversations((current) => rows.map((row) => {
      const prior = current.find((item) => item.id === row.id);
      return { id: row.id, participantIds: [buyerId, row.agentId], buyerName: 'You', agentName: row.agentName, propertyId: row.listingId, unread: Number(row.unread), lastTime: fmtTime(row.updatedAt), lastMessage: row.lastMessage, messages: prior?.messages ?? [] };
    }));
  }, [buyerId]);
  useEffect(() => {
    Promise.all([getBuyerProfile(), getPublicListings()]).then(async ([profile, listings]) => { setBuyerId(profile.id); setProperties(listings.map(toProperty)); const rows = await getBuyerInquiries(); setConversations(rows.map((row) => ({ id: row.id, participantIds: [profile.id, row.agentId], buyerName: 'You', agentName: row.agentName, propertyId: row.listingId, unread: Number(row.unread), lastTime: fmtTime(row.updatedAt), lastMessage: row.lastMessage, messages: [] }))); }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, []);
  const openConversation = async (id: string) => {
    const requestId = ++conversationRequest.current;
    setActiveId(id); setLoadingMessages(true); setError('');
    try {
      const [, messages] = await Promise.all([markBuyerInquiryRead(id), getBuyerMessages(id)]);
      if (requestId === conversationRequest.current) {
        const last = messages[messages.length - 1];
        if (last) messageCursors.current.set(id, { createdAt: last.cursorCreatedAt, id: last.id });
        setConversations((items) => items.map((item) => item.id === id ? { ...item, unread: 0, messages: [...new Map([...item.messages, ...messages.map(toChatMessage)].map((message) => [message.id, message])).values()].sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? '') || a.id.localeCompare(b.id)) } : item));
      }
    } catch (reason) {
      if (requestId === conversationRequest.current) setError(reason instanceof Error ? reason.message : 'Unable to load conversation.');
    } finally {
      if (requestId === conversationRequest.current) setLoadingMessages(false);
    }
  };
  useEffect(() => {
    const requested = searchParams.get('inquiry');
    if (requested && conversations.some((item) => item.id === requested) && autoOpened.current !== requested) { autoOpened.current = requested; void openConversation(requested); }
  }, [searchParams, conversations]);
  const refreshActive = useCallback(async (id = activeId) => { if (!id) return; const messages = await getBuyerMessages(id); const last = messages[messages.length - 1]; if (last) messageCursors.current.set(id, { createdAt: last.cursorCreatedAt, id: last.id }); setConversations((items) => items.map((item) => item.id === id ? { ...item, messages: [...new Map([...item.messages, ...messages.map(toChatMessage)].map((message) => [message.id, message])).values()].sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? '') || a.id.localeCompare(b.id)) } : item)); await refreshInquiries(); }, [activeId, refreshInquiries]);
  const syncActive = useCallback(async (id: string) => {
    const cursor = messageCursors.current.get(id);
    if (!cursor) return refreshActive(id);
    const messages = await getBuyerMessagesAfter(id, cursor.createdAt, cursor.id);
    if (!messages.length) return;
    const last = messages[messages.length - 1]!;
    messageCursors.current.set(id, { createdAt: last.cursorCreatedAt, id: last.id });
    setConversations((items) => items.map((item) => item.id === id ? { ...item, messages: [...new Map([...item.messages, ...messages.map(toChatMessage)].map((message) => [message.id, message])).values()].sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? '') || a.id.localeCompare(b.id)) } : item));
  }, [refreshActive]);
  useEffect(() => {
    if (!buyerId) return;
    const sync = (event: { id: string; inquiryId: string }) => {
      void refreshInquiries();
      if (event.inquiryId === activeId) {
        void refreshActive(event.inquiryId).then(() => { setConversations((items) => items.map((item) => item.id === event.inquiryId ? { ...item, unread: 0 } : item)); return markBuyerInquiryRead(event.inquiryId); }).catch((reason: Error) => setError(reason.message));
      }
    };
    return subscribeToBuyerChatEvents(sync, () => { void refreshInquiries(); if (activeId) void syncActive(activeId); });
  }, [buyerId, activeId, refreshInquiries, refreshActive, syncActive]);
  const mine = useMemo(() => conversations.filter((item) => item.participantIds.includes(buyerId)), [buyerId, conversations]);
  const visible = mine.filter((item) => filter === 'All' || item.unread > 0);
  const active = mine.find((item) => item.id === activeId) ?? null;
  const send = async (body: string, clientMessageId: string) => { if (!activeId) return; await sendBuyerMessage(activeId, body, clientMessageId); await refreshActive(activeId); };
  const offer = async (amount: number, note: string) => { if (!activeId) return; await sendBuyerOffer(activeId, amount, note); await refreshActive(); };
  const decision = async (id: string, status: 'accepted' | 'declined') => { await respondToBuyerOffer(id, status); await refreshActive(); };

  if (loading) return <main className="discovery-page messages-page"><h1 className="messages-title">Messages</h1><StateMessage title="Loading conversations…" text="Your latest conversations are loading." kind="loading" /></main>;
  return <main className={`discovery-page messages-page${active ? ' has-active' : ''}`}>
    <h1 className="messages-title">Messages</h1>
    {error && <p className="auth-login__error" role="alert">{error}</p>}
    {mine.length === 0 ? <StateMessage icon="chat" title="No messages yet" text="When you send an inquiry to an agent, the conversation shows up here."><Button className="state-message__button" onClick={() => onNavigate('properties')}>Browse properties</Button></StateMessage> : <>
      <div className="message-filters" role="group" aria-label="Filter conversations">{(['All', 'Unread'] as const).map((name) => <button key={name} type="button" className={`message-filter${filter === name ? ' is-active' : ''}`} aria-pressed={filter === name} onClick={() => setFilter(name)}>{name}</button>)}</div>
      <div className="messages-layout"><aside className="messages-layout__list">{visible.length ? <ConversationList conversations={visible} properties={properties} activeId={activeId} viewerRole="buyer" viewerId={buyerId} onSelect={(id) => void openConversation(id)} /> : <StateMessage icon="chat" title="No unread messages" text="You're all caught up." />}</aside>
        <div className="messages-layout__view">{active ? loadingMessages ? <StateMessage title="Loading conversation…" text="Messages are loading." kind="loading" /> : <ConversationView key={active.id} conversation={active} properties={properties} viewerId={buyerId} onBack={() => { conversationRequest.current += 1; setActiveId(null); setLoadingMessages(false); }} onSend={send} onOffer={offer} onOfferDecision={decision} /> : <StateMessage icon="chat" title="Select a conversation" text="Choose a conversation to read messages and offers." />}</div>
      </div>
    </>}
  </main>;
}
