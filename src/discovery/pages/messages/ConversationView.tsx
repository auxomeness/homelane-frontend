import { useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, House, Send } from 'lucide-react';
import type { ChatMessage, Conversation, Property } from '../../types.js';
import { getProperty } from '../../utils.js';
import OfferCard from '../../shared/OfferCard.js';

interface ConversationViewProps {
  conversation: Conversation;
  properties: Property[];
  viewerId: string;
  onBack: () => void;
  onSend: (body: string, clientMessageId: string) => Promise<void>;
  onOfferDecision: (offerId: string, status: 'accepted' | 'declined') => Promise<void>;
}

export default function ConversationView({ conversation, properties, viewerId, onBack, onSend, onOfferDecision }: ConversationViewProps) {
  const [draft, setDraft] = useState('');
  const [clientMessageId, setClientMessageId] = useState<string | null>(null);
  const [optimisticMessage, setOptimisticMessage] = useState<ChatMessage | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const property = getProperty(properties, conversation.propertyId);
  const otherName = conversation.participantIds[0] === viewerId ? conversation.agentName : conversation.buyerName;

  useLayoutEffect(() => {
    const messages = messagesRef.current;
    if (!messages) return;
    messages.scrollTop = messages.scrollHeight;
  }, [conversation.messages, optimisticMessage]);

  const submitMessage = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    const requestId = clientMessageId ?? crypto.randomUUID();
    setClientMessageId(requestId);
    setOptimisticMessage({ id: `pending-${requestId}`, senderId: viewerId, text, time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), deliveryStatus: 'pending' });
    setBusy(true); setError('');
    try { await onSend(text, requestId); setDraft(''); setClientMessageId(null); setOptimisticMessage(null); }
    catch (reason) { setOptimisticMessage((current) => current ? { ...current, deliveryStatus: 'failed' } : current); setError(reason instanceof Error ? reason.message : 'Unable to send message.'); }
    finally { setBusy(false); }
  };
  const send = (event: FormEvent) => { event.preventDefault(); void submitMessage(); };
  return (
    <section className="agent-panel agent-message-thread buyer-message-thread" aria-label={`Conversation with ${otherName}`}>
      <header className="agent-thread-header">
        <button type="button" className="agent-thread-back" onClick={onBack} aria-label="Back to conversations"><ArrowLeft size={18} /></button>
        <span className="agent-inquiry__avatar" aria-hidden="true">{otherName.trim().charAt(0).toUpperCase() || 'H'}</span>
        <div><h2>{otherName}</h2><p><House size={14} /> {property?.title} · {property?.area}</p></div>
        <span className="agent-thread-status">Conversation</span>
      </header>
      <div className="agent-message-thread__conversation" ref={messagesRef} aria-live="polite" aria-relevant="additions">
        {conversation.messages.length === 0 && <div className="agent-thread-placeholder"><strong>No messages yet</strong><p>Say hello to start the conversation.</p></div>}
        {[...conversation.messages, ...(optimisticMessage ? [optimisticMessage] : [])].map((message) => {
          const mine = message.senderId === viewerId;
          return <article key={message.id} className={`agent-message-bubble${mine ? ' agent-message-bubble--outgoing' : ''}`}>
            {message.offer && <><OfferCard {...message.offer} mine={mine} />{!mine && message.offer.status === 'Pending' && message.offer.id && <div className="offer-response"><button type="button" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await onOfferDecision(message.offer!.id!, 'accepted'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to accept offer.'); } finally { setBusy(false); } }}>Accept</button><button type="button" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await onOfferDecision(message.offer!.id!, 'declined'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to decline offer.'); } finally { setBusy(false); } }}>Decline</button></div>}</>}
            {message.offer && <button type="button" className="agent-message-bubble__details" aria-expanded={detailsOpen === message.id} onClick={() => setDetailsOpen((open) => open === message.id ? null : message.id)}>Details</button>}
            {message.text && <button type="button" className="agent-message-bubble__body" aria-expanded={detailsOpen === message.id} onClick={() => setDetailsOpen((open) => open === message.id ? null : message.id)}>{message.text}</button>}
            {detailsOpen === message.id && <small>{mine ? 'You' : otherName} · {message.time}</small>}
            {message.deliveryStatus === 'pending' && <small role="status">Sending…</small>}
            {message.deliveryStatus === 'failed' && <small className="buyer-message-error">Not sent. <button type="button" onClick={() => void submitMessage()}>Retry</button></small>}
          </article>;
        })}
      </div>
      <form className="buyer-message-composer" onSubmit={send}>
        <label className="agent-sr-only" htmlFor="buyer-reply">Write a reply</label>
        <input id="buyer-reply" type="text" value={draft} onChange={(e) => { setDraft(e.target.value); if (clientMessageId && optimisticMessage?.deliveryStatus === 'failed') { setClientMessageId(null); setOptimisticMessage(null); } }} placeholder="Reply to agent..." aria-label="Message" />
        <button className="agent-send-button" type="submit" aria-label="Send message" disabled={busy || !draft.trim()}><Send size={18} /></button>
      </form>
      {error && <p role="alert" className="buyer-message-error">{error}</p>}
    </section>
  );
}
