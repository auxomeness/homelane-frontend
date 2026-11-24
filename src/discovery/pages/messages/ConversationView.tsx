import { useState, type FormEvent } from 'react';
import type { Conversation, Property } from '../../types.js';
import { getProperty } from '../../utils.js';
import OfferCard from '../../shared/OfferCard.js';

interface ConversationViewProps {
  conversation: Conversation;
  properties: Property[];
  viewerId: string;
  onBack: () => void;
  onSend: (body: string) => Promise<void>;
  onOffer: (amount: number, note: string) => Promise<void>;
  onOfferDecision: (offerId: string, status: 'accepted' | 'declined') => Promise<void>;
}

export default function ConversationView({ conversation, properties, viewerId, onBack, onSend, onOffer, onOfferDecision }: ConversationViewProps) {
  const [draft, setDraft] = useState('');
  const [offerOpen, setOfferOpen] = useState(false); const [amount, setAmount] = useState(''); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const property = getProperty(properties, conversation.propertyId);
  const otherName = conversation.participantIds[0] === viewerId ? conversation.agentName : conversation.buyerName;

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true); setError('');
    try { await onSend(text); setDraft(''); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to send message.'); } finally { setBusy(false); }
  };
  const submitOffer = async (event: FormEvent) => { event.preventDefault(); const value = Number(amount); if (!Number.isFinite(value) || value <= 0 || busy) return; setBusy(true); setError(''); try { await onOffer(value, note.trim()); setAmount(''); setNote(''); setOfferOpen(false); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to send offer.'); } finally { setBusy(false); } };

  return (
    <section className="conversation-view" aria-label={`Conversation with ${otherName}`}>
      <header className="conversation-view__header">
        <button type="button" className="conversation-view__back" onClick={onBack} aria-label="Back to conversations">‹</button>
        <div>
          <strong>{otherName}</strong>
          <span>{property?.title} · {property?.area}</span>
        </div>
      </header>

      <div className="conversation-view__messages">
        {conversation.messages.length === 0 && (
          <p className="composer__note">No messages yet. Say hello below.</p>
        )}
        {conversation.messages.map((message) => {
          const mine = message.senderId === viewerId;
          return (
            <div key={message.id} className={`message${mine ? ' is-mine' : ''}`}>
              {message.offer && <><OfferCard {...message.offer} mine={mine} />{!mine && message.offer.status === 'Pending' && message.offer.id && <div className="offer-response"><button type="button" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await onOfferDecision(message.offer!.id!, 'accepted'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to accept offer.'); } finally { setBusy(false); } }}>Accept</button><button type="button" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await onOfferDecision(message.offer!.id!, 'declined'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to decline offer.'); } finally { setBusy(false); } }}>Decline</button></div>}</>}
              {message.text && <p className="message__bubble">{message.text}</p>}
              <time>{message.time}</time>
            </div>
          );
        })}
      </div>

      <form className="composer" onSubmit={send}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type your message"
          aria-label="Message"
        />
        <button type="submit" aria-label="Send message" disabled={busy}>Send</button>
      </form>
      <button type="button" className="composer__offer-toggle" onClick={() => setOfferOpen((open) => !open)}>Make an offer</button>
      {offerOpen && <form className="composer composer--offer" onSubmit={submitOffer}><input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Offer amount (PHP)" aria-label="Offer amount" required /><input type="text" maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note" aria-label="Offer note" /><button type="submit" disabled={busy}>Send offer</button></form>}
      {error && <p role="alert" className="composer__error">{error}</p>}
      <p className="composer__note">Offers in this chat are non-binding.</p>
    </section>
  );
}
