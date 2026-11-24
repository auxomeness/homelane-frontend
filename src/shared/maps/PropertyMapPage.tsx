import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Bath, BedDouble, ChevronDown, ChevronUp, MapPin, Maximize2, X } from 'lucide-react';
import { getPublicListings, type PropertyListing } from './listingsApi.js';
import PropertyMap, { normalizeRadiusKm } from './PropertyMap.js';
import PriceRangeSelect from './PriceRangeSelect.js';
import './fullscreenMap.css';
import { bookBuyerAppointment, createBuyerInquiry, getBuyerSlots, getBuyerToken, getSavedListings, saveListing, unsaveListing, type ViewingSlot } from '../../discovery/buyerApi.js';

export type BrowserRole = 'visitor' | 'buyer';
interface Props {
  role: BrowserRole;
  mode: 'list' | 'map';
  basePath?: string;
  listPath?: string;
  embedded?: boolean;
}

export default function PropertyMapPage({ role, mode, basePath: basePathOverride, listPath: listPathOverride, embedded = false }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [visibleOnMap, setVisibleOnMap] = useState<PropertyListing[]>([]);
  const [mapResultsKnown, setMapResultsKnown] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]); const [slots, setSlots] = useState<ViewingSlot[]>([]); const [selectedSlot, setSelectedSlot] = useState(''); const [buyerNote, setBuyerNote] = useState(''); const [actionError, setActionError] = useState(''); const [actionBusy, setActionBusy] = useState(false); const [slotMode, setSlotMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = basePathOverride ?? `/${role}`;
  const listPath = listPathOverride ?? basePath;
  const mapPath = `${basePath}/map`;
  const closePath = role === 'visitor' ? '/' : `${listPath}${searchParams.size ? `?${searchParams}` : ''}`;
  const closeLabel = role === 'visitor' ? 'Back to Homelane homepage' : 'Back to property list';
  const search = searchParams.get('q') ?? '';
  const type = searchParams.get('type') ?? 'all';
  const minPrice = searchParams.get('min') ?? '';
  const maxPrice = searchParams.get('max') ?? '';
  const radiusKm = normalizeRadiusKm(Number(searchParams.get('radius') ?? '10'));
  const selectedId = searchParams.get('selected');
  const selectedListing = listings.find((listing) => listing.id === selectedId);

  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let current = true;
    setLoading(true); setError('');
    getPublicListings().then((next) => { if (current) setListings(next); }).catch((reason: Error) => { console.error(reason); if (current) setError(reason.message); }).finally(() => { if (current) setLoading(false); });
    if (role === 'buyer' && getBuyerToken()) getSavedListings().then((items) => { if (current) setSavedIds(items.map((item) => item.id)); }).catch(() => undefined);
    return () => { current = false; };
  }, [reloadKey, role]);
  // Friendly message for visitors and buyers. The technical reason is only written to the browser console.
  const errorNotice = <div className="map-error" role="alert"><p>We could not load the properties right now. Please check your connection and try again.</p><button type="button" className="map-retry" onClick={() => setReloadKey((key) => key + 1)}>Try again</button></div>;
  const noListingsText = listings.length ? 'No published properties match these filters.' : 'No properties have been published yet. Please check back soon.';
  const toggleSaved = async (listing: PropertyListing) => { setActionBusy(true); setActionError(''); try { if (savedIds.includes(listing.id)) { await unsaveListing(listing.id); setSavedIds((ids) => ids.filter((id) => id !== listing.id)); } else { await saveListing(listing.id); setSavedIds((ids) => [...ids, listing.id]); } } catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Unable to save this home.'); } finally { setActionBusy(false); } };
  const contactAgent = async (listing: PropertyListing) => { if (!getBuyerToken()) { navigate('/auth/login?mode=login', { state: { from: location.pathname + location.search } }); return; } setActionBusy(true); setActionError(''); try { const result = await createBuyerInquiry(listing.id, `Hi, I’m interested in ${listing.title}. Please share more details.`); navigate(`/discovery/messages?inquiry=${encodeURIComponent(result.inquiry.id)}`); } catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Unable to contact the agent.'); } finally { setActionBusy(false); } };
  const openSlots = async (listing: PropertyListing) => { if (!getBuyerToken()) { navigate('/auth/login?mode=login', { state: { from: location.pathname + location.search } }); return; } setActionBusy(true); setActionError(''); setSlotMode(true); try { const results = await getBuyerSlots(listing.id); setSlots(results); setSelectedSlot(results[0]?.id ?? ''); } catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Unable to load viewing times.'); } finally { setActionBusy(false); } };
  const bookSlot = async () => { if (!selectedSlot) return; setActionBusy(true); setActionError(''); try { await bookBuyerAppointment(selectedSlot, buyerNote); setSlotMode(false); setBuyerNote(''); navigate('/discovery/viewings'); } catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Unable to request this viewing.'); } finally { setActionBusy(false); } };
  const setParam = useCallback((key: string, value: string) => setSearchParams((current) => { const next = new URLSearchParams(current); if (value) next.set(key, value); else next.delete(key); return next; }, { replace: true }), [setSearchParams]);
  const setPriceRange = useCallback((min: string, max: string) => setSearchParams((current) => { const next = new URLSearchParams(current); min ? next.set('min', min) : next.delete('min'); max ? next.set('max', max) : next.delete('max'); return next; }, { replace: true }), [setSearchParams]);
  const filtered = useMemo(() => listings.filter((listing) => {
    const textMatches = `${listing.title} ${listing.location} ${listing.description}`.toLowerCase().includes(search.trim().toLowerCase());
    return textMatches && (type === 'all' || listing.propertyType.toLowerCase() === type.toLowerCase()) && (!minPrice || Number(listing.price) >= Number(minPrice)) && (!maxPrice || Number(listing.price) <= Number(maxPrice));
  }), [listings, maxPrice, minPrice, search, type]);
  const updateVisible = useCallback((next: PropertyListing[]) => { setVisibleOnMap(next); setMapResultsKnown(true); }, []);
  const selectListing = useCallback((listing: PropertyListing) => setParam('selected', listing.id), [setParam]);
  const filterForm = <div className="map-filter-fields"><label>Search<input value={search} onChange={(event) => setParam('q', event.target.value)} placeholder="Title or location" /></label><label>Property type<select value={type} onChange={(event) => setParam('type', event.target.value)}><option value="all">All types</option>{['House', 'Condo', 'Townhouse', 'Lot'].map((item) => <option key={item}>{item}</option>)}</select></label><PriceRangeSelect min={minPrice} max={maxPrice} onChange={setPriceRange} /></div>;

  if (mode === 'map') return <main className="fullscreen-map-screen public-map-screen">
    <aside className={`fullscreen-map-panel${panelOpen ? '' : ' is-collapsed'}`}>
      <div className="fullscreen-map-panel__title"><div><span>HOMELANE · {role === 'visitor' ? 'PUBLIC MAP' : 'BUYER MAP'}</span><h1>Explore homes</h1></div><div className="fullscreen-map-panel__actions"><Link className="map-close" to={closePath} viewTransition={role === 'visitor'} aria-label={closeLabel} title={closeLabel}><X size={20} /></Link><button type="button" className="map-panel-collapse" aria-expanded={panelOpen} aria-label={panelOpen ? 'Collapse results panel' : 'Expand results panel'} onClick={() => setPanelOpen((open) => !open)}>{panelOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button></div></div>
      <div className="fullscreen-map-panel__content"><nav className="fullscreen-map-panel__tabs" aria-label={`${role} property views`}><NavLink to={`${listPath}${searchParams.size ? `?${searchParams}` : ''}`} end>List</NavLink><NavLink to={`${mapPath}${searchParams.size ? `?${searchParams}` : ''}`}>Map</NavLink></nav>{filterForm}
        {selectedListing && <><article className="public-map-selected"><span className="public-map-selected__photo">{selectedListing.photos[0] ? <img src={selectedListing.photos[0]} alt="" /> : <span aria-hidden="true">⌂</span>}</span><div className="public-map-selected__summary"><span className="public-map-selected__eyebrow">SELECTED HOME</span><strong>{selectedListing.title}</strong><small>{selectedListing.location}</small><b>₱ {Number(selectedListing.price).toLocaleString('en-PH')}</b><small className="public-map-selected__agent">Listed by {selectedListing.agentName || 'Homelane agent'}</small></div><button type="button" aria-label="Clear selected property" title="Clear selected property" onClick={() => { setSlotMode(false); setParam('selected', ''); }}><X size={16} /></button><div className="public-map-selected__details"><div className="public-map-selected__facts"><span>{selectedListing.propertyType}</span>{selectedListing.bedrooms != null && <span>{selectedListing.bedrooms} {selectedListing.bedrooms === 1 ? 'bedroom' : 'bedrooms'}</span>}{selectedListing.bathrooms != null && <span>{selectedListing.bathrooms} {selectedListing.bathrooms === 1 ? 'bathroom' : 'bathrooms'}</span>}{selectedListing.floorArea != null && <span>{selectedListing.floorArea} m²</span>}</div><p>{selectedListing.description || 'No description provided.'}</p><Link className="public-map-details-link" to={`${role === 'visitor' ? '/visitor' : '/discovery'}/properties/${encodeURIComponent(selectedListing.id)}`}>View full property details →</Link></div></article>
          {role === 'buyer' && <div className="public-map-buyer-actions"><button type="button" disabled={actionBusy} onClick={() => void toggleSaved(selectedListing)}>{savedIds.includes(selectedListing.id) ? 'Remove saved home' : 'Save home'}</button><button type="button" disabled={actionBusy} onClick={() => void contactAgent(selectedListing)}>Ask agent</button><button type="button" disabled={actionBusy} onClick={() => void openSlots(selectedListing)}>Request viewing</button></div>}
          {slotMode && <section className="public-map-slot-picker" aria-label="Request a viewing"><h2>Choose a viewing time</h2>{slots.length ? <><label>Available time<select value={selectedSlot} onChange={(event) => setSelectedSlot(event.target.value)}>{slots.map((slot) => <option key={slot.id} value={slot.id}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(slot.startsAt))}</option>)}</select></label><label>Note (optional)<input value={buyerNote} maxLength={1000} onChange={(event) => setBuyerNote(event.target.value)} placeholder="Anything the agent should know?" /></label><button type="button" disabled={actionBusy || !selectedSlot} onClick={() => void bookSlot()}>{actionBusy ? 'Requesting…' : 'Send request'}</button></> : <p>No available viewing times right now.</p>}<button type="button" onClick={() => setSlotMode(false)}>Close</button></section>}
          {actionError && <p className="map-error" role="alert">{actionError}</p>}</>}
        <p className="map-result-count">{mapResultsKnown ? visibleOnMap.length : filtered.length} {filtered.length === 1 ? 'home' : 'homes'} in this area</p>
        <div className="map-result-list">{loading && <p className="map-empty" role="status">Loading published properties…</p>}{(mapResultsKnown ? visibleOnMap : filtered).map((listing) => <button type="button" className={`map-result-card${selectedId === listing.id ? ' is-selected' : ''}`} key={listing.id} onClick={() => selectListing(listing)}>
          {listing.photos[0] ? <img src={listing.photos[0]} alt="" /> : <div className="map-result-card__image">⌂</div>}<span><b>{listing.title}</b><small>{listing.location}</small><strong>₱ {Number(listing.price).toLocaleString('en-PH')}</strong></span>
        </button>)}{!loading && !error && mapResultsKnown && !visibleOnMap.length && <p className="map-empty">No published homes in this radius.</p>}{!loading && !error && !filtered.length && !mapResultsKnown && <p className="map-empty">{noListingsText}</p>}{error && errorNotice}</div>
      </div>
    </aside>
    <div className="fullscreen-map-canvas"><PropertyMap listings={filtered} fullscreen panelCollapsed={!panelOpen} height="100%" radiusKm={radiusKm} onRadiusChange={(value) => setParam('radius', String(value))} selectedListingId={selectedId} onListingSelect={selectListing} onVisibleListingsChange={updateVisible} /></div>
  </main>;

  return <main className={`property-list-page${embedded ? ' property-list-page--embedded' : ''}`}>{!embedded && role === 'visitor' && <div className="property-list-topbar"><Link className="property-list-brand" to="/" aria-label="Homelane home"><img src="/logo/Purple%20House%20Path%20Logo%20Icon.png" alt=""/><span>homelane</span></Link><nav className="property-list-topbar__links" aria-label="Visitor navigation"><Link to="/visitor">Explore homes</Link><Link to="/visitor/map">Map</Link></nav><div className="property-list-auth"><Link className="property-list-auth__signin" to="/auth/login">Sign in</Link><Link className="property-list-auth__signup" to="/auth/login?mode=signup">Create an account</Link></div></div>}{!embedded && <header className="property-list-header"><div><p>HOMELANE · {role.toUpperCase()}</p><h1>{role === 'visitor' ? 'A better way to find home' : 'Explore homes made for you'}</h1><span>{role === 'visitor' ? 'Discover thoughtfully selected homes, meet trusted agents, and find the right place for your next chapter.' : 'Compare homes, meet trusted agents, and plan your next move.'}</span></div><nav aria-label={`${role} property views`}><NavLink to={listPath} end>List</NavLink><NavLink to={`${mapPath}${searchParams.size ? `?${searchParams}` : ''}`}>Map</NavLink></nav></header>}{role === 'visitor' && !embedded && <section className="visitor-welcome"><div><span>YOUR NEXT CHAPTER STARTS HERE</span><h2>Find a home that feels like yours.</h2><p>Browse available homes, explore their neighborhoods, and connect with the person who can help you move forward.</p><Link to="/auth/login?mode=signup">Create a free account <span aria-hidden="true">→</span></Link></div><div className="visitor-welcome__stats"><strong>{listings.length}<small> homes to explore</small></strong><strong>Direct<small> agent connection</small></strong><strong>Easy<small> viewing requests</small></strong></div></section>}<section className="property-list-filters">{filterForm}</section>
    {loading && <p className="map-empty">Loading properties…</p>}{error && errorNotice}
    <section className="property-list-grid">{filtered.map((listing) => <article className="property-list-card" key={listing.id}><Link className="property-list-card__link" aria-label={`View ${listing.title} property details`} to={`${role === 'visitor' ? '/visitor' : '/discovery'}/properties/${encodeURIComponent(listing.id)}`}>
      <span className="property-list-card__photo">{listing.photos[0] ? <img src={listing.photos[0]} alt={listing.title} /> : <span className="property-list-card__image" aria-hidden="true">⌂</span>}<span className="property-list-card__type">{listing.propertyType}</span><span className="property-list-card__photo-hint">View home <span aria-hidden="true">↗</span></span></span>
      <span className="property-list-card__body"><span className="property-list-card__title">{listing.title}</span><span className="property-list-card__location"><MapPin size={15}/>{listing.location}</span><strong>₱ {Number(listing.price).toLocaleString('en-PH')}</strong><span className="property-list-card__facts">{listing.bedrooms != null && <span><BedDouble size={16}/>{listing.bedrooms} bd</span>}{listing.bathrooms != null && <span><Bath size={16}/>{listing.bathrooms} ba</span>}{listing.floorArea != null && <span><Maximize2 size={15}/>{listing.floorArea} m²</span>}</span></span>
    </Link></article>)}</section>
    {!loading && !error && !filtered.length && <p className="map-empty">{noListingsText}</p>}
  </main>;
}
