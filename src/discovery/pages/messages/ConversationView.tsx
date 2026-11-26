import { useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
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
    <section className="conversation-view" aria-label={`Conversation with ${otherName}`}>
      <header className="conversation-view__header">
        <button type="button" className="conversation-view__back" onClick={onBack} aria-label="Back to conversations"><ArrowLeft size={18} /></button>
        <span className="conversation-view__avatar" aria-hidden="true">{otherName.trim().charAt(0).toUpperCase() || 'H'}</span>
        <div className="conversation-view__identity">
          <strong>{otherName}</strong>
          <span>{property?.title} · {property?.area}</span>
        </div>
      </header>

      <div className="conversation-view__thread">
        <div className="conversation-view__section-label">Conversation</div>
        <div className="conversation-view__messages" ref={messagesRef} aria-live="polite" aria-relevant="additions">
          {conversation.messages.length === 0 && <p className="conversation-view__empty">No messages yet. Say hello below.</p>}
          {[...conversation.messages, ...(optimisticMessage ? [optimisticMessage] : [])].map((message) => {
            const mine = message.senderId === viewerId;
            return (
              <div key={message.id} className={`message${mine ? ' is-mine' : ''}`}>
                {message.offer && <><OfferCard {...message.offer} mine={mine} />{!mine && message.offer.status === 'Pending' && message.offer.id && <div className="offer-response"><button type="button" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await onOfferDecision(message.offer!.id!, 'accepted'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to accept offer.'); } finally { setBusy(false); } }}>Accept</button><button type="button" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await onOfferDecision(message.offer!.id!, 'declined'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to decline offer.'); } finally { setBusy(false); } }}>Decline</button></div>}</>}
                {message.offer && <button type="button" className="message__details-toggle" aria-expanded={detailsOpen === message.id} onClick={() => setDetailsOpen((open) => open === message.id ? null : message.id)}>Details</button>}
                {message.text && <button type="button" className="message__bubble" aria-expanded={detailsOpen === message.id} onClick={() => setDetailsOpen((open) => open === message.id ? null : message.id)}>{message.text}</button>}
                {detailsOpen === message.id && <time className="message__details">{message.time}</time>}
                {message.deliveryStatus === 'pending' && <small role="status">Sending…</small>}
                {message.deliveryStatus === 'failed' && <small className="composer__error">Not sent. <button type="button" onClick={() => void submitMessage()}>Retry</button></small>}
              </div>
            );
          })}
        </div>
        <form className="composer composer--unified" onSubmit={send}>
          <input type="text" value={draft} onChange={(e) => { setDraft(e.target.value); if (clientMessageId && optimisticMessage?.deliveryStatus === 'failed') { setClientMessageId(null); setOptimisticMessage(null); } }} placeholder="Reply to agent..." aria-label="Message" />
          <button type="submit" aria-label="Send message" disabled={busy || !draft.trim()}><Send size={18} /></button>
        </form>
        {error && <p role="alert" className="composer__error conversation-view__error">{error}</p>}
      </div>
    </section>
  );
}
