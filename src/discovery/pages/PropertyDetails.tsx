import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { ArrowLeft, BadgeCheck, BedDouble, Bath, Maximize2, MessageCircle, CalendarDays, Bookmark } from 'lucide-react';
import { getPublicListing, type PropertyListing } from '../../shared/maps/listingsApi.js';
import { bookBuyerAppointment, createBuyerInquiry, getBuyerSlots, getBuyerToken, getSavedListings, saveListing, type ViewingSlot } from '../buyerApi.js';
import StateMessage from '../shared/StateMessage.js';

const price = (value: number) => `₱ ${Number(value).toLocaleString('en-PH')}`;
export default function PropertyDetails() {
  const { listingId = '' } = useParams(); const location = useLocation(); const navigate = useNavigate();
  const isVisitor = location.pathname.startsWith('/visitor/'); const listRoute = isVisitor ? '/visitor' : '/discovery/properties'; const mapRoute = isVisitor ? '/visitor/map' : '/discovery/map';
  const [listing, setListing] = useState<PropertyListing | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [slots, setSlots] = useState<ViewingSlot[]>([]); const [slotId, setSlotId] = useState(''); const [note, setNote] = useState(''); const [showSlots, setShowSlots] = useState(false); const [busy, setBusy] = useState(false); const [actionError, setActionError] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => { let live = true; getPublicListing(listingId).then((item) => { if (live) setListing(item); }).catch((reason: Error) => { if (live) setError(reason.message); }).finally(() => { if (live) setLoading(false); }); if (getBuyerToken()) getSavedListings().then((items) => { if (live) setSaved(items.some((item) => item.id === listingId)); }).catch(() => undefined); return () => { live = false; }; }, [listingId]);
  const requireBuyer = () => { if (getBuyerToken()) return true; navigate('/auth/login?mode=login', { state: { from: location.pathname + location.search } }); return false; };
  const messageAgent = async () => { if (!listing || !requireBuyer()) return; setBusy(true); setActionError(''); try { const result = await createBuyerInquiry(listing.id, `Hi, I’m interested in ${listing.title}. Please share more details.`); navigate(`/discovery/messages?inquiry=${encodeURIComponent(result.inquiry.id)}`); } catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Could not contact the agent.'); } finally { setBusy(false); } };
  const loadSlots = async () => { if (!listing || !requireBuyer()) return; setShowSlots(true); setBusy(true); setActionError(''); try { const result = await getBuyerSlots(listing.id); setSlots(result); setSlotId(result[0]?.id ?? ''); } catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Could not load viewing times.'); } finally { setBusy(false); } };
  const requestViewing = async () => { if (!slotId) return; setBusy(true); setActionError(''); try { await bookBuyerAppointment(slotId, note); navigate('/discovery/viewings'); } catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Could not request this viewing.'); } finally { setBusy(false); } };
  const saveHome = async () => { if (!listing || !requireBuyer()) return; setBusy(true); setActionError(''); try { await saveListing(listing.id); setSaved(true); } catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Could not save this home.'); } finally { setBusy(false); } };
  if (loading) return <main className="discovery-page property-details-page"><StateMessage kind="loading" title="Loading property…" text="Getting the listing and agent information." /></main>;
  if (error || !listing) return <main className="discovery-page property-details-page"><Link className="property-details-back" to={listRoute}><ArrowLeft size={18}/> Back to homes</Link><StateMessage title="Property unavailable" text={error || 'This published listing could not be found.'}/></main>;
  const agent = listing.agentProfile;
  return <main className="discovery-page property-details-page">
    <Link className="property-details-back" to={listRoute}><ArrowLeft size={18}/> Back to homes</Link>
    <div className="property-details-title"><div><span className="property-details-eyebrow">{listing.propertyType} · FOR SALE</span><h1>{listing.title}</h1><p>{listing.location}</p></div><strong>{price(listing.price)}</strong></div>
    <div className="property-details-gallery">{listing.photos.length ? listing.photos.slice(0, 5).map((photo, index) => <img key={`${photo}-${index}`} src={photo} alt={`${listing.title} photo ${index + 1}`} />) : <div className="property-details-placeholder">⌂<span>Photos coming soon</span></div>}</div>
    <div className="property-details-layout"><section className="property-details-main">
      <div className="property-details-facts">{listing.bedrooms != null && <span><BedDouble/> {listing.bedrooms} bedrooms</span>}{listing.bathrooms != null && <span><Bath/> {listing.bathrooms} bathrooms</span>}{listing.floorArea != null && <span><Maximize2/> {listing.floorArea} m²</span>}</div>
      <article className="property-details-card"><h2>About this home</h2><p>{listing.description || 'Contact the agent to learn more about this property.'}</p></article>
      <article className="property-details-card"><h2>Location</h2><p>{listing.location}</p><Link to={`${mapRoute}?selected=${encodeURIComponent(listing.id)}`}>See this home on the map →</Link></article>
    </section><aside className="property-details-aside">
      <article className="property-agent-card"><span className="property-agent-avatar">{(agent?.name || listing.agentName || 'H').charAt(0).toUpperCase()}</span><div><span className="property-details-eyebrow">LISTED BY</span><h2>{agent?.name || listing.agentName || 'Homelane agent'} {agent?.verified && <BadgeCheck size={18} aria-label="Verified agent"/>}</h2><p>{agent?.credential || 'Property agent'}{agent?.city ? ` · ${agent.city}` : ''}</p></div>{agent?.verified && <span className="property-agent-verified"><BadgeCheck size={15}/> Verified</span>}</article>
      <div className="property-details-actions"><button type="button" disabled={busy} onClick={() => void messageAgent()}><MessageCircle size={18}/> {busy ? 'Please wait…' : 'Message agent'}</button><button type="button" className="is-secondary" disabled={busy} onClick={() => void loadSlots()}><CalendarDays size={18}/> Request a viewing</button><button type="button" className="is-secondary" disabled={busy || saved} onClick={() => void saveHome()}><Bookmark size={18}/> {saved ? 'Saved to your homes' : 'Save this home'}</button></div>
      {showSlots && <section className="property-viewing-picker"><h3>Choose a viewing time</h3>{slots.length ? <><label>Available time<select value={slotId} onChange={(event) => setSlotId(event.target.value)}>{slots.map((slot) => <option key={slot.id} value={slot.id}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(slot.startsAt))}</option>)}</select></label><label>Note to agent (optional)<textarea maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Share a preferred time or question"/></label><button type="button" disabled={busy || !slotId} onClick={() => void requestViewing()}>{busy ? 'Sending…' : 'Send viewing request'}</button></> : <p>{busy ? 'Loading available times…' : 'There are no available times right now. Please message the agent.'}</p>}<button className="property-viewing-close" type="button" onClick={() => setShowSlots(false)}>Close</button></section>}
      {actionError && <p className="property-details-error" role="alert">{actionError}</p>}
      <p className="property-details-secure">Contact the agent directly through Homelane. Your contact details stay private until you choose to share them.</p>
    </aside></div>
  </main>;
}
