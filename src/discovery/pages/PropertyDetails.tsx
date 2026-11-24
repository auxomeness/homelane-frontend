import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { ArrowLeft, BadgeCheck, BedDouble, Bath, Maximize2, MessageCircle, CalendarDays, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getPublicListing, type PropertyListing } from '../../shared/maps/listingsApi.js';
import { bookBuyerAppointment, createBuyerInquiry, getBuyerSlots, getBuyerToken, getSavedListings, saveListing, unsaveListing, type ViewingSlot } from '../buyerApi.js';
import StateMessage from '../shared/StateMessage.js';

const price = (value: number) => `₱ ${Number(value).toLocaleString('en-PH')}`;
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export default function PropertyDetails() {
  const { listingId = '' } = useParams(); const location = useLocation(); const navigate = useNavigate();
  const isVisitor = location.pathname.startsWith('/visitor/'); const listRoute = isVisitor ? '/visitor' : '/discovery/properties'; const mapRoute = isVisitor ? '/visitor/map' : '/discovery/map';
  const [listing, setListing] = useState<PropertyListing | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [slots, setSlots] = useState<ViewingSlot[]>([]); const [slotId, setSlotId] = useState(''); const [selectedDate, setSelectedDate] = useState(''); const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1)); const [note, setNote] = useState(''); const [showSlots, setShowSlots] = useState(false); const [busy, setBusy] = useState(false); const [actionError, setActionError] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => { let live = true; getPublicListing(listingId).then((item) => { if (live) setListing(item); }).catch((reason: Error) => { if (live) setError(reason.message); }).finally(() => { if (live) setLoading(false); }); if (getBuyerToken()) getSavedListings().then((items) => { if (live) setSaved(items.some((item) => item.id === listingId)); }).catch(() => undefined); return () => { live = false; }; }, [listingId]);
  const requireBuyer = () => { if (getBuyerToken()) return true; navigate('/auth/login?mode=login', { state: { from: location.pathname + location.search } }); return false; };
  const messageAgent = async () => { if (!listing || !requireBuyer()) return; setBusy(true); setActionError(''); try { const result = await createBuyerInquiry(listing.id, `Hi, I’m interested in ${listing.title}. Please share more details.`); navigate(`/discovery/messages?inquiry=${encodeURIComponent(result.inquiry.id)}`); } catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Could not contact the agent.'); } finally { setBusy(false); } };
  const slotsByDate = useMemo(() => slots.reduce<Record<string, ViewingSlot[]>>((groups, slot) => { const key = dateKey(new Date(slot.startsAt)); (groups[key] ??= []).push(slot); return groups; }, {}), [slots]);
  const selectedDateSlots = slotsByDate[selectedDate] ?? [];
  const calendarDays = useMemo(() => { const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1); const start = new Date(first); start.setDate(1 - first.getDay()); return Array.from({ length: 42 }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + index); return day; }); }, [calendarMonth]);
  useEffect(() => {
    if (!showSlots) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) setShowSlots(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showSlots, busy]);
  const loadSlots = async () => { if (!listing || !requireBuyer()) return; setShowSlots(true); setSlots([]); setSlotId(''); setSelectedDate(''); setBusy(true); setActionError(''); try { const result = await getBuyerSlots(listing.id); setSlots(result); if (result[0]) { const firstDate = dateKey(new Date(result[0].startsAt)); setSelectedDate(firstDate); const date = new Date(result[0].startsAt); setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1)); setSlotId(result[0].id); } } catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Could not load viewing times.'); } finally { setBusy(false); } };
  const requestViewing = async () => { if (!slotId) return; setBusy(true); setActionError(''); try { await bookBuyerAppointment(slotId, note); navigate('/discovery/viewings'); } catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Could not request this viewing.'); } finally { setBusy(false); } };
  const saveHome = async () => { if (!listing || !requireBuyer()) return; setBusy(true); setActionError(''); try { if (saved) { await unsaveListing(listing.id); setSaved(false); } else { await saveListing(listing.id); setSaved(true); } } catch (reason) { setActionError(reason instanceof Error ? reason.message : saved ? 'Could not remove this home from your saved homes.' : 'Could not save this home.'); } finally { setBusy(false); } };
  if (loading) return <main className="discovery-page property-details-page"><StateMessage kind="loading" title="Loading property…" text="Getting the listing and agent information." /></main>;
  if (error || !listing) return <main className="discovery-page property-details-page"><Link className="property-details-back" to={listRoute}><ArrowLeft size={18}/> Back to homes</Link><StateMessage title="Property unavailable" text={error || 'This published listing could not be found.'}/></main>;
  const agent = listing.agentProfile;
  return <main className="discovery-page property-details-page">
    <Link className="property-details-back" to={listRoute}><ArrowLeft size={18}/> Back to homes</Link>
    <div className="property-details-title"><div><span className="property-details-eyebrow">{listing.propertyType} · FOR SALE</span><h1>{listing.title}</h1><p>{listing.location}</p></div><strong>{price(listing.price)}</strong></div>
    <div className={`property-details-gallery${listing.photos.length > 1 ? ' has-multiple' : ''}`}>{listing.photos.length ? listing.photos.slice(0, 5).map((photo, index) => <img key={`${photo}-${index}`} src={photo} alt={`${listing.title} photo ${index + 1}`} />) : <div className="property-details-placeholder">⌂<span>Photos coming soon</span></div>}</div>
    <div className="property-details-layout"><section className="property-details-main">
      <div className="property-details-facts" aria-label="Property features">{listing.bedrooms != null && <span><BedDouble/><strong>{listing.bedrooms}</strong><small>{listing.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</small></span>}{listing.bathrooms != null && <span><Bath/><strong>{listing.bathrooms}</strong><small>{listing.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}</small></span>}{listing.floorArea != null && <span><Maximize2/><strong>{Number(listing.floorArea).toLocaleString('en-PH')}</strong><small>Square meters</small></span>}</div>
      <article className="property-details-card"><h2>About this home</h2><p>{listing.description || 'Contact the agent to learn more about this property.'}</p></article>
      <article className="property-details-card"><h2>Location</h2><p>{listing.location}</p><Link to={`${mapRoute}?selected=${encodeURIComponent(listing.id)}`}>See this home on the map →</Link></article>
    </section><aside className="property-details-aside">
      <article className="property-agent-card"><span className="property-agent-avatar">{(agent?.name || listing.agentName || 'H').charAt(0).toUpperCase()}</span><div><span className="property-details-eyebrow">LISTED BY</span><h2>{agent?.name || listing.agentName || 'Homelane agent'} {agent?.verified && <BadgeCheck size={18} aria-label="Verified agent"/>}</h2><p>{agent?.credential || 'Property agent'}{agent?.city ? ` · ${agent.city}` : ''}</p></div>{agent?.verified && <span className="property-agent-verified"><BadgeCheck size={15}/> Verified</span>}</article>
      <div className="property-details-actions"><button type="button" disabled={busy} onClick={() => void messageAgent()}><MessageCircle size={18}/> {busy ? 'Please wait…' : 'Message agent'}</button><button type="button" className="is-secondary" disabled={busy} onClick={() => void loadSlots()}><CalendarDays size={18}/> Request a viewing</button><button type="button" className={`is-secondary${saved ? ' is-saved' : ''}`} disabled={busy} aria-pressed={saved} onClick={() => void saveHome()}>{saved ? <BookmarkCheck size={18}/> : <Bookmark size={18}/>} {saved ? 'Remove from saved homes' : 'Save this home'}</button></div>
      {showSlots && createPortal(<div className="viewing-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setShowSlots(false); }}>
        <section className="viewing-modal" role="dialog" aria-modal="true" aria-labelledby="viewing-modal-title">
          <header className="viewing-modal__header"><div><span className="property-details-eyebrow">SCHEDULE A VISIT</span><h2 id="viewing-modal-title">Request a viewing</h2><p>{listing.title}</p></div><button type="button" aria-label="Close viewing calendar" disabled={busy} onClick={() => setShowSlots(false)}><X size={20}/></button></header>
          {busy && !slots.length ? <p className="viewing-modal__status">Loading available dates…</p> : slots.length ? <>
            <div className="viewing-calendar"><div className="viewing-calendar__month"><button type="button" aria-label="Previous month" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}><ChevronLeft size={19}/></button><strong>{new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(calendarMonth)}</strong><button type="button" aria-label="Next month" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}><ChevronRight size={19}/></button></div>
              <div className="viewing-calendar__grid" role="grid" aria-label="Available viewing dates">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day) => <span className="viewing-calendar__weekday" role="columnheader" key={day}>{day}</span>)}{calendarDays.map((day) => { const key = dateKey(day); const hasSlots = Boolean(slotsByDate[key]?.length); const inMonth = day.getMonth() === calendarMonth.getMonth(); return <button type="button" role="gridcell" key={key} disabled={!hasSlots} aria-label={`${new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(day)}${hasSlots ? ', available' : ', unavailable'}`} aria-pressed={selectedDate === key} className={`viewing-calendar__day${inMonth ? '' : ' is-outside'}${hasSlots ? ' has-slots' : ''}${selectedDate === key ? ' is-selected' : ''}`} onClick={() => { setSelectedDate(key); setSlotId(''); }}>{day.getDate()}{hasSlots && <i aria-hidden="true"/>}</button>; })}</div>
              <p className="viewing-calendar__legend"><i/> Available viewing</p>
            </div>
            <div className="viewing-slots"><h3>{selectedDate ? new Intl.DateTimeFormat(undefined, { weekday:'long', month:'long', day:'numeric' }).format(new Date(`${selectedDate}T12:00:00`)) : 'Choose an available date'}</h3>{selectedDateSlots.length ? <div className="viewing-slots__options">{selectedDateSlots.map((slot) => <button type="button" key={slot.id} aria-pressed={slotId === slot.id} className={slotId === slot.id ? 'is-selected' : ''} onClick={() => setSlotId(slot.id)}>{new Intl.DateTimeFormat(undefined, { timeStyle:'short' }).format(new Date(slot.startsAt))}</button>)}</div> : <p>Select a highlighted date to see its available times.</p>}</div>
            <label className="viewing-note">Note to agent (optional)<textarea maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Share a preferred time or question"/></label>
            <button className="viewing-modal__submit" type="button" disabled={busy || !slotId} onClick={() => void requestViewing()}>{busy ? 'Sending request…' : 'Send viewing request'}</button>
          </> : <p className="viewing-modal__status">There are no available viewing times right now. Please message the agent.</p>}
          {actionError && <p className="property-details-error" role="alert">{actionError}</p>}
        </section>
      </div>, document.body)}
      {actionError && <p className="property-details-error" role="alert">{actionError}</p>}
      <p className="property-details-secure">Contact the agent directly through Homelane. Your contact details stay private until you choose to share them.</p>
    </aside></div>
  </main>;
}
