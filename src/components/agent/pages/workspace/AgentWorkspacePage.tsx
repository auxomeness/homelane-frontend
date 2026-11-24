import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, CalendarClock, CalendarDays, CheckCircle2, Clock3, House, Inbox, MapPin, MessageSquareText, Send, ShieldCheck, Trash2, UserRound, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import Button from '../../../button.js';
import { useAgentData } from '../../libs/AgentDataContext.js';
import './workspaceStyles.css';

const dateLabel = (date: string) => new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
const localDateValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const localTimeValue = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

export default function AgentWorkspacePage() {
  const location = useLocation(); const navigate = useNavigate();
  const { listings, inquiries, profile, updateProfile, markInquiryRead, loadConversation, conversations, replyToInquiry, offerToInquiry, respondToOffer, appointments, slots, createSlot, deleteSlot, updateAppointment, activity, activityHasMore, loadMoreActivity, loading, error, reload } = useAgentData();
  const section = location.pathname.split('/').at(-1) ?? '';
  const selectedInquiryId = new URLSearchParams(location.search).get('inquiry');
  const [activeInquiryId, setActiveInquiryId] = useState(selectedInquiryId ?? '');
  const [reply, setReply] = useState(''); const [busy, setBusy] = useState(false); const [formError, setFormError] = useState('');
  const [offerOpen, setOfferOpen] = useState(false); const [offerAmount, setOfferAmount] = useState(''); const [offerNote, setOfferNote] = useState('');
  const [profileForm, setProfileForm] = useState(profile); const [saved, setSaved] = useState(false);
  const [slotForm, setSlotForm] = useState({ listingId: '', date: '', startsAt: '', endsAt: '' });
  const [inquiryFilter, setInquiryFilter] = useState<'all' | 'new'>('all');
  const [conversationLoading, setConversationLoading] = useState(false);

  useEffect(() => { if (selectedInquiryId) setActiveInquiryId(selectedInquiryId); else if (!activeInquiryId && inquiries[0]) setActiveInquiryId(inquiries[0].id); }, [selectedInquiryId, activeInquiryId, inquiries]);
  useEffect(() => { setProfileForm(profile); }, [profile]);
  useEffect(() => {
    if (!activeInquiryId || (section !== 'messages' && section !== 'inquiries')) return;
    let current = true;
    setConversationLoading(true);
    void loadConversation(activeInquiryId)
      .catch((reason) => { if (current) setFormError(reason instanceof Error ? reason.message : 'Unable to load conversation.'); })
      .finally(() => { if (current) setConversationLoading(false); });
    if (inquiries.find((item) => item.id === activeInquiryId)?.status === 'new') void markInquiryRead(activeInquiryId).catch(() => undefined);
    return () => { current = false; };
  }, [activeInquiryId, section]);
  const activeInquiry = inquiries.find((inquiry) => inquiry.id === activeInquiryId);
  const visibleInquiries = inquiryFilter === 'new' ? inquiries.filter((inquiry) => inquiry.status === 'new') : inquiries;
  const today = localDateValue(new Date());

  const submitReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!activeInquiry || !reply.trim()) return;
    setBusy(true); setFormError('');
    try { await replyToInquiry(activeInquiry.id, reply.trim()); setReply(''); }
    catch (reason) { setFormError(reason instanceof Error ? reason.message : 'Unable to send reply.'); }
    finally { setBusy(false); }
  };
  const submitOffer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!activeInquiry || !Number.isFinite(Number(offerAmount)) || Number(offerAmount) <= 0) return;
    setBusy(true); setFormError('');
    try { await offerToInquiry(activeInquiry.id, Number(offerAmount), offerNote.trim()); setOfferAmount(''); setOfferNote(''); setOfferOpen(false); }
    catch (reason) { setFormError(reason instanceof Error ? reason.message : 'Unable to send offer.'); }
    finally { setBusy(false); }
  };
  const decideOffer = async (id: string, status: 'accepted' | 'declined') => {
    setBusy(true); setFormError('');
    try { await respondToOffer(id, status); }
    catch (reason) { setFormError(reason instanceof Error ? reason.message : 'Unable to respond to offer.'); }
    finally { setBusy(false); }
  };
  const submitProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setFormError(''); setSaved(false);
    try { await updateProfile(profileForm); setSaved(true); }
    catch (reason) { setFormError(reason instanceof Error ? reason.message : 'Unable to save profile.'); }
    finally { setBusy(false); }
  };
  const submitSlot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!slotForm.date || !slotForm.startsAt || !slotForm.endsAt) { setFormError('Choose a date, start time, and end time.'); return; }
    if (slotForm.endsAt <= slotForm.startsAt) { setFormError('End time must be later than start time.'); return; }
    setBusy(true); setFormError('');
    try { await createSlot({ listingId: slotForm.listingId, startsAt: new Date(`${slotForm.date}T${slotForm.startsAt}`).toISOString(), endsAt: new Date(`${slotForm.date}T${slotForm.endsAt}`).toISOString() }); setSlotForm({ listingId: '', date: '', startsAt: '', endsAt: '' }); }
    catch (reason) { setFormError(reason instanceof Error ? reason.message : 'Unable to create viewing time.'); }
    finally { setBusy(false); }
  };
  const appointmentAction = async (id: string, status: 'confirmed' | 'declined') => {
    setBusy(true); setFormError('');
    try { await updateAppointment(id, status); }
    catch (reason) { setFormError(reason instanceof Error ? reason.message : 'Unable to update appointment.'); }
    finally { setBusy(false); }
  };
  const removeSlot = async (id: string) => {
    setBusy(true); setFormError('');
    try { await deleteSlot(id); }
    catch (reason) { setFormError(reason instanceof Error ? reason.message : 'Unable to remove viewing time.'); }
    finally { setBusy(false); }
  };

  const messages = activeInquiry ? conversations[activeInquiry.id] ?? [] : [];
  if (section === 'viewings') return <main className="agent-workspace-page agent-viewings-page">
    <div className="agent-page-heading"><div><span className="agent-viewings-eyebrow">SCHEDULING</span><h1>Viewings</h1><p>Make it easy for buyers to see a place they love.</p></div><a className="agent-viewings-jump" href="#agent-viewing-availability"><CalendarClock size={17} /> Offer a time</a></div>
    {error && <div className="agent-workspace-error" role="alert">{error}<button type="button" onClick={() => void reload()}>Retry</button></div>}
    {formError && <p className="agent-form-error" role="alert">{formError}</p>}
    <section className="agent-viewings-overview" aria-label="Viewing overview">
      <article className="agent-panel agent-viewing-stat"><span className="agent-viewing-stat__icon agent-viewing-stat__icon--violet"><Users size={19} /></span><div><small>Requests</small><strong>{appointments.filter((item) => item.status === 'pending').length}</strong><span>waiting for your reply</span></div></article>
      <article className="agent-panel agent-viewing-stat"><span className="agent-viewing-stat__icon agent-viewing-stat__icon--blue"><CheckCircle2 size={19} /></span><div><small>Confirmed</small><strong>{appointments.filter((item) => item.status === 'confirmed').length}</strong><span>scheduled appointments</span></div></article>
      <article className="agent-panel agent-viewing-stat"><span className="agent-viewing-stat__icon agent-viewing-stat__icon--gold"><Clock3 size={19} /></span><div><small>Available times</small><strong>{slots.filter((slot) => slot.status === 'available').length}</strong><span>open for buyers to book</span></div></article>
    </section>
    <section className="agent-panel agent-slot-form agent-viewing-availability" id="agent-viewing-availability">
      <div className="agent-viewing-section-title"><span className="agent-viewing-form-icon"><CalendarClock size={20} /></span><div><h2>Offer a viewing time</h2><p>Choose one of your active listings and set a time buyers can request.</p></div></div>
      <form onSubmit={submitSlot}>
        <label>Active listing<select value={slotForm.listingId} required onChange={(event) => setSlotForm({ ...slotForm, listingId: event.target.value })}><option value="">Choose a listing</option>{listings.filter((item) => item.status === 'active').map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
        <label>Date<input type="date" required min={today} value={slotForm.date} onChange={(event) => setSlotForm({ ...slotForm, date: event.target.value, startsAt: '', endsAt: '' })} /></label>
        <label>Start time<input type="time" required step={900} min={slotForm.date === today ? localTimeValue(new Date()) : undefined} value={slotForm.startsAt} onChange={(event) => setSlotForm({ ...slotForm, startsAt: event.target.value, endsAt: slotForm.endsAt && slotForm.endsAt <= event.target.value ? '' : slotForm.endsAt })} /></label>
        <label>End time<input type="time" required step={900} min={slotForm.startsAt || undefined} value={slotForm.endsAt} onChange={(event) => setSlotForm({ ...slotForm, endsAt: event.target.value })} /></label>
        <Button className="agent-button agent-button--primary" size="medium" type="submit" disabled={busy || !listings.some((item) => item.status === 'active') || !slotForm.date || !slotForm.startsAt || !slotForm.endsAt || slotForm.endsAt <= slotForm.startsAt}><CalendarDays size={17} /> Add availability</Button>
      </form>
      {!listings.some((item) => item.status === 'active') && <p className="agent-viewings-hint">An active listing is needed before you can offer viewing times.</p>}
    </section>
    <section className="agent-viewing-section">
      <div className="agent-viewing-section-heading"><div><span className="agent-viewings-eyebrow">BUYER ACTIVITY</span><h2>Appointment requests</h2></div><span className="agent-viewing-count">{appointments.length} total</span></div>
      {loading ? <p className="agent-empty-state">Loading appointments…</p> : appointments.length ? <div className="agent-viewing-request-grid">{appointments.map((item) => {
        const inquiry = inquiries.find((entry) => entry.buyerId === item.buyerId);
        return <article className="agent-panel agent-viewing-request" key={item.id}>
          <div className="agent-viewing-request__top"><span className="agent-viewing-avatar">{item.buyerName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><div className="agent-viewing-request__buyer"><h3>{item.buyerName}</h3><p>Viewing request</p></div><span className={`agent-viewing-status agent-viewing-status--${item.status}`}>{item.status}</span></div>
          <div className="agent-viewing-property"><MapPin size={16} /><span>{item.listingTitle}</span></div>
          <div className="agent-viewing-time"><CalendarDays size={18} /><div><strong>{new Date(item.startsAt).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</strong><span>{new Date(item.startsAt).toLocaleTimeString([], { timeStyle: 'short' })} – {new Date(item.endsAt).toLocaleTimeString([], { timeStyle: 'short' })}</span></div></div>
          {item.buyerNote && <p className="agent-viewing-note">“{item.buyerNote}”</p>}
          <div className="agent-viewing-request__actions">{item.status === 'pending' && <><Button className="agent-button agent-button--primary" size="small" disabled={busy} onClick={() => void appointmentAction(item.id, 'confirmed')}>Confirm request</Button><Button className="agent-button agent-button--secondary" variant="secondary" size="small" disabled={busy} onClick={() => void appointmentAction(item.id, 'declined')}>Decline</Button></>}{inquiry && <Button className="agent-button agent-button--secondary" variant="secondary" size="small" onClick={() => navigate(`/agent/messages?inquiry=${encodeURIComponent(inquiry.id)}`)}>Message buyer</Button>}</div>
        </article>;
      })}</div> : <div className="agent-panel agent-viewing-empty"><span><Users size={21} /></span><h3>No requests yet</h3><p>When a buyer requests one of your available times, it’ll show up here.</p></div>}
    </section>
    <section className="agent-viewing-section">
      <div className="agent-viewing-section-heading"><div><span className="agent-viewings-eyebrow">YOUR SCHEDULE</span><h2>Available viewing times</h2></div><span className="agent-viewing-count">{slots.filter((slot) => slot.status === 'available').length} open</span></div>
      {loading ? <p className="agent-empty-state">Loading availability…</p> : slots.length ? <div className="agent-viewing-slot-grid">{slots.map((slot) => <article className="agent-panel agent-viewing-slot" key={slot.id}><div className="agent-viewing-slot__date"><strong>{new Date(slot.startsAt).toLocaleDateString([], { month: 'short' })}</strong><span>{new Date(slot.startsAt).toLocaleDateString([], { day: '2-digit' })}</span></div><div className="agent-viewing-slot__info"><h3>{slot.listingTitle}</h3><p><Clock3 size={15} />{new Date(slot.startsAt).toLocaleTimeString([], { timeStyle: 'short' })} – {new Date(slot.endsAt).toLocaleTimeString([], { timeStyle: 'short' })}</p><span className={`agent-viewing-status agent-viewing-status--${slot.status}`}>{slot.status}</span></div>{slot.status === 'available' && <Button className="agent-viewing-remove" variant="secondary" size="small" aria-label={`Remove time for ${slot.listingTitle}`} disabled={busy} onClick={() => void removeSlot(slot.id)}><Trash2 size={16} /></Button>}</article>)}</div> : <div className="agent-panel agent-viewing-empty"><span><CalendarDays size={21} /></span><h3>No open times</h3><p>Add availability above so buyers can request a viewing.</p></div>}
    </section>
  </main>;

  if (section === 'messages' || section === 'inquiries') return <main className={`agent-workspace-page agent-communications-page${section === 'messages' ? ' is-messages' : ' is-inquiries'}`}>
    <div className="agent-page-heading"><div><span className="agent-workspace-eyebrow">BUYER RELATIONSHIPS</span><h1>{section === 'messages' ? 'Messages' : 'Inquiries'}</h1><p>{section === 'messages' ? 'Continue the conversation, one home at a time.' : 'Keep track of new buyers and follow up with care.'}</p></div>{section === 'inquiries' && <span className="agent-inquiry-total"><strong>{inquiries.length}</strong> {inquiries.length === 1 ? 'inquiry' : 'inquiries'}</span>}</div>
    {error && <div className="agent-workspace-error" role="alert">{error}<button type="button" onClick={() => void reload()}>Retry</button></div>}{formError && <p className="agent-form-error" role="alert">{formError}</p>}
    <div className="agent-messages-layout agent-communications-layout">
      <aside className="agent-panel agent-message-list" aria-label={section === 'messages' ? 'Conversation inbox' : 'Buyer inquiry inbox'}>
        <div className="agent-inbox-heading"><div><span className="agent-workspace-eyebrow">INBOX</span><h2>{section === 'messages' ? 'Conversations' : 'Buyer inquiries'}</h2></div><span className="agent-inbox-count">{inquiries.length}</span></div>
        {section === 'inquiries' && <div className="agent-inquiry-filters" role="group" aria-label="Filter inquiries"><button type="button" className={inquiryFilter === 'all' ? 'is-active' : ''} aria-pressed={inquiryFilter === 'all'} onClick={() => setInquiryFilter('all')}>All <span>{inquiries.length}</span></button><button type="button" className={inquiryFilter === 'new' ? 'is-active' : ''} aria-pressed={inquiryFilter === 'new'} onClick={() => setInquiryFilter('new')}>New <span>{inquiries.filter((item) => item.status === 'new').length}</span></button></div>}
        {loading && !inquiries.length ? <div className="agent-inbox-empty"><span className="agent-inbox-empty__icon"><Inbox size={21} /></span><strong>Loading your inbox</strong><p>Your latest buyer conversations will appear here.</p></div> : visibleInquiries.length ? <div className="agent-message-list__items">{visibleInquiries.map((inquiry) => <button type="button" className={`agent-message-list__item${activeInquiry?.id === inquiry.id ? ' is-active' : ''}`} key={inquiry.id} onClick={() => { setActiveInquiryId(inquiry.id); setFormError(''); }}><span className="agent-inquiry__avatar">{inquiry.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><span className="agent-message-list__copy"><strong>{inquiry.name}</strong><small className="agent-message-list__property">{inquiry.property}</small><small>{inquiry.message}</small></span><span className="agent-message-list__meta">{inquiry.status === 'new' && <i aria-label="Unread" title="New inquiry" />}<small>{inquiry.time}</small></span></button>)}</div> : <div className="agent-inbox-empty"><span className="agent-inbox-empty__icon"><Inbox size={21} /></span><strong>{inquiryFilter === 'new' ? 'You’re all caught up' : 'No buyer conversations yet'}</strong><p>{inquiryFilter === 'new' ? 'New inquiries will be highlighted here.' : 'Buyer messages about your listings will land here.'}</p>{inquiryFilter === 'all' && <Button className="agent-button agent-button--secondary" variant="secondary" size="small" onClick={() => navigate('/agent/my-listings')}>View listings <ArrowUpRight size={15} /></Button>}</div>}
      </aside>
      {activeInquiry ? <section className="agent-panel agent-message-thread" aria-label={`Conversation with ${activeInquiry.name}`}>
        <header className="agent-thread-header"><span className="agent-inquiry__avatar">{activeInquiry.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><div><h2>{activeInquiry.name}</h2><p><House size={14} /> {activeInquiry.property}</p></div><span className={`agent-thread-status${activeInquiry.status === 'new' ? ' is-new' : ''}`}>{activeInquiry.status === 'new' ? 'New inquiry' : 'Conversation'}</span></header>
        <div className="agent-message-thread__conversation" aria-live="polite">
          {conversationLoading ? <div className="agent-thread-placeholder"><span className="agent-thread-placeholder__icon"><MessageSquareText size={22} /></span><strong>Opening conversation…</strong></div> : messages.length ? messages.map((message) => <article className={`agent-message-bubble${message.senderType === 'agent' ? ' agent-message-bubble--outgoing' : ''}`} key={message.id}>{message.offer ? <div className="agent-offer-card"><div><strong>{message.offer.kind === 'offer' ? 'Offer' : 'Counteroffer'}</strong><span>{message.offer.status}</span></div><b>₱ {Number(message.offer.amount).toLocaleString('en-PH')}</b>{message.offer.note && <p>{message.offer.note}</p>}<small>Non-binding offer · Not a commitment.</small>{message.senderType === 'buyer' && message.offer.status === 'pending' && <div className="agent-offer-card__actions"><button type="button" disabled={busy} onClick={() => void decideOffer(message.offer!.id, 'accepted')}>Accept</button><button type="button" disabled={busy} onClick={() => void decideOffer(message.offer!.id, 'declined')}>Decline</button></div>}</div> : <p>{message.body}</p>}<small>{message.senderType === 'agent' ? 'You' : activeInquiry.name} · {dateLabel(message.createdAt)}</small></article>) : <div className="agent-thread-placeholder"><span className="agent-thread-placeholder__icon"><MessageSquareText size={22} /></span><strong>No messages yet</strong><p>Send a reply to start the conversation with {activeInquiry.name.split(' ')[0]}.</p></div>}
        </div>
        <form onSubmit={submitReply}><label className="agent-sr-only" htmlFor="agent-reply">Write a reply</label><textarea id="agent-reply" value={reply} onChange={(event) => setReply(event.target.value)} placeholder={`Reply to ${activeInquiry.name.split(' ')[0]}…`} required maxLength={5000} disabled={conversationLoading || busy} /><button className="agent-send-button" type="submit" aria-label="Send reply" disabled={busy || conversationLoading || !reply.trim()}><Send size={18} /></button></form>
        <button type="button" className="agent-offer-toggle" onClick={() => setOfferOpen((open) => !open)}>Make an offer or counteroffer</button>
        {offerOpen && <form className="agent-offer-form" onSubmit={submitOffer}><label>Amount (PHP)<input type="number" min="0.01" step="0.01" required value={offerAmount} onChange={(event) => setOfferAmount(event.target.value)} /></label><label>Note (optional)<input type="text" maxLength={1000} value={offerNote} onChange={(event) => setOfferNote(event.target.value)} /></label><Button className="agent-button agent-button--primary" size="small" type="submit" disabled={busy || conversationLoading}>Send offer</Button></form>}
      </section> : <section className="agent-panel agent-message-thread agent-message-thread--unselected" aria-label="Conversation panel"><span className="agent-thread-placeholder__icon"><MessageSquareText size={24} /></span><h2>{inquiries.length ? 'Select a conversation' : 'Your conversation space'}</h2><p>{inquiries.length ? 'Choose a buyer from your inbox to view the messages and reply.' : 'When a buyer asks about one of your properties, the conversation will appear here.'}</p>{!inquiries.length && <Button className="agent-button agent-button--primary" size="small" onClick={() => navigate('/agent/my-listings')}>Manage listings <ArrowUpRight size={15} /></Button>}</section>}
    </div>
  </main>;

  if (section === 'activity') return <main className="agent-workspace-page agent-activity-page"><div className="agent-page-heading"><div><span className="agent-workspace-eyebrow">YOUR WORKSPACE</span><h1>Activity</h1><p>A clear history of what’s happening across your listings and buyers.</p></div><Button className="agent-button agent-button--secondary" variant="secondary" size="medium" onClick={() => navigate('/agent/my-listings')}>Manage listings <ArrowUpRight size={16} /></Button></div>{error && <div className="agent-workspace-error" role="alert">{error}<button type="button" onClick={() => void reload()}>Retry</button></div>}{formError && <p className="agent-form-error" role="alert">{formError}</p>}
    {loading && !activity.length ? <div className="agent-panel agent-activity-empty"><span><Clock3 size={22} /></span><h2>Loading activity</h2><p>Gathering the latest updates from your workspace.</p></div> : activity.length ? <section className="agent-panel agent-activity-timeline" aria-label="Recent activity"><div className="agent-activity-timeline__intro"><span className="agent-workspace-eyebrow">RECENT UPDATES</span><p>{activity.length} recent {activity.length === 1 ? 'event' : 'events'}</p></div>{activity.map((event) => {
      const label = event.eventType.replaceAll('_', ' ');
      const canOpen = event.entityType === 'listing';
      return <article className="agent-activity-event" key={event.id}><span className="agent-activity-event__marker">{event.entityType === 'listing' ? <House size={17} /> : event.entityType === 'inquiry' || event.entityType === 'message' ? <MessageSquareText size={17} /> : <CalendarDays size={17} />}</span><div className="agent-activity-event__content"><div className="agent-activity-event__meta"><span className="agent-activity-event__type">{label}</span><time dateTime={event.createdAt}>{dateLabel(event.createdAt)}</time></div><p>{event.summary}</p></div>{canOpen && <button type="button" className="agent-activity-event__open" aria-label={`Open ${event.summary}`} onClick={() => navigate(`/agent/my-listings/${event.entityId}`)}><ArrowRight size={17} /></button>}</article>;
    })}</section> : <section className="agent-panel agent-activity-empty"><span><Clock3 size={22} /></span><span className="agent-workspace-eyebrow">A FRESH START</span><h2>Your activity will show up here</h2><p>Listing updates, buyer inquiries, messages, and viewing requests will appear in this timeline.</p><div><Button className="agent-button agent-button--primary" size="small" onClick={() => navigate('/agent/add-listings')}>Add a listing <ArrowUpRight size={15} /></Button><Button className="agent-button agent-button--secondary" variant="secondary" size="small" onClick={() => navigate('/agent/inquiries')}>View inquiries</Button></div></section>}
    {activityHasMore && <div className="agent-activity-more"><Button className="agent-button agent-button--secondary" variant="secondary" disabled={busy} onClick={() => void loadMoreActivity().catch((reason) => setFormError(reason instanceof Error ? reason.message : 'Unable to load more activity.'))}>Load more activity</Button></div>}</main>;

  if (section === 'profile') {
    const initials = profileForm.name.trim().split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'AG';
    return <main className="agent-workspace-page agent-profile-page"><div className="agent-page-heading"><div><span className="agent-workspace-eyebrow">YOUR PUBLIC PRESENCE</span><h1>Agent profile</h1><p>Help buyers know who they’ll be working with.</p></div></div>{error && <div className="agent-workspace-error" role="alert">{error}<button type="button" onClick={() => void reload()}>Retry</button></div>}{formError && <p className="agent-form-error" role="alert">{formError}</p>}
      <div className="agent-profile-layout"><section className="agent-panel agent-profile-preview"><span className="agent-profile-preview__avatar">{initials}</span><span className="agent-workspace-eyebrow">PROFILE PREVIEW</span><h2>{profileForm.name || 'Your name'}</h2><p>{profileForm.credential || 'Professional credential'}</p><div className="agent-profile-preview__location"><MapPin size={15} />{profileForm.city || 'City and region'}</div><span className={`agent-profile-verification${profileForm.verified ? ' is-verified' : ''}`}><ShieldCheck size={15} />{profileForm.verified ? 'Verified Homelane agent' : 'Homelane agent'}</span><p className="agent-profile-preview__note">This information helps buyers feel confident when they contact you.</p></section>
        <form className="agent-panel agent-profile-form" onSubmit={(event) => void submitProfile(event)}><div className="agent-profile-form__heading"><span className="agent-profile-form__icon"><UserRound size={19} /></span><div><h2>Profile details</h2><p>Keep your buyer-facing information current.</p></div></div><label htmlFor="agent-profile-name">Full name<input id="agent-profile-name" autoComplete="name" value={profileForm.name} required maxLength={120} onChange={(event) => { setProfileForm({ ...profileForm, name: event.target.value }); setSaved(false); }} /></label><label htmlFor="agent-profile-credential">License or credential<input id="agent-profile-credential" value={profileForm.credential} required maxLength={160} placeholder="e.g. PRC license" onChange={(event) => { setProfileForm({ ...profileForm, credential: event.target.value }); setSaved(false); }} /></label><label htmlFor="agent-profile-city">City and region<input id="agent-profile-city" autoComplete="address-level2" value={profileForm.city} required maxLength={160} placeholder="e.g. Naga City, Camarines Sur" onChange={(event) => { setProfileForm({ ...profileForm, city: event.target.value }); setSaved(false); }} /></label><div className="agent-profile-form__footer"><span>Changes are saved to your Homelane profile.</span><Button className="agent-button agent-button--primary" size="medium" type="submit" disabled={busy || loading}>{busy ? 'Saving…' : 'Save changes'} <ArrowUpRight size={16} /></Button></div>{saved && <p className="agent-profile-saved" role="status"><CheckCircle2 size={16} /> Profile updated successfully.</p>}</form></div>
    </main>;
  }

  return <main className="agent-workspace-page"><p className="agent-empty-state">This workspace page could not be found.</p><Button className="agent-button agent-button--secondary" variant="secondary" onClick={() => navigate('/agent/dashboard')}>Back to dashboard</Button></main>;
}
