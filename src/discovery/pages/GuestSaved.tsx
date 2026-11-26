import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Bath, BedDouble, MapPin, Maximize2 } from 'lucide-react';
import { getPublicListings, type PropertyListing } from '../../shared/maps/listingsApi.js';
import { getBuyerToken } from '../buyerApi.js';
import { getGuestSavedIds, toggleGuestSaved } from '../guestSaved.js';
import '../../shared/maps/fullscreenMap.css';

export default function GuestSaved() {
  const navigate = useNavigate();
  const [ids, setIds] = useState(getGuestSavedIds);
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (getBuyerToken()) { navigate('/discovery/profile', { replace: true }); return; }
    let live = true;
    getPublicListings().then((items) => { if (live) setListings(items); }).catch(() => { if (live) setError(true); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [navigate]);

  const homes = listings.filter((listing) => ids.includes(listing.id));
  const remove = (id: string) => { toggleGuestSaved(id); setIds(getGuestSavedIds()); };
  const requireAccount = (listing: PropertyListing, mode: 'login' | 'signup') =>
    navigate(`/auth/login?mode=${mode}`, { state: { from: `/discovery/properties/${encodeURIComponent(listing.id)}` } });

  return <main className="property-list-page">
    <div className="property-list-topbar"><Link className="property-list-brand" to="/" aria-label="Homelane home"><img src="/logo/Purple%20House%20Path%20Logo%20Icon.png" alt="" /><span>homelane</span></Link><nav className="property-list-topbar__links" aria-label="Visitor navigation"><Link to="/visitor">Explore homes</Link><Link to="/visitor/map">Map</Link><Link to="/visitor/saved">Saved homes</Link></nav><div className="property-list-auth"><Link className="property-list-auth__signin" to="/auth/login">Sign in</Link><Link className="property-list-auth__signup" to="/auth/login?mode=signup">Create an account</Link></div></div>
    <header className="property-list-header"><div><p>HOMELANE · SAVED HOMES</p><h1>Your saved homes</h1><span>These are saved on this device. Sign in or create an account to message an agent, see full details, or make an offer.</span></div></header>
    {loading && <p className="map-empty">Loading your saved homes…</p>}
    {error && <p className="map-empty" role="alert">We could not load your saved homes right now. Please try again.</p>}
    <section className="property-list-grid">{homes.map((listing) => <article className="property-list-card" key={listing.id}>
      <span className="property-list-card__photo">{listing.photos[0] ? <img src={listing.photos[0]} alt={listing.title} /> : <span className="property-list-card__image" aria-hidden="true">⌂</span>}<span className="property-list-card__type">{listing.propertyType}</span></span>
      <span className="property-list-card__body"><span className="property-list-card__title">{listing.title}</span><span className="property-list-card__location"><MapPin size={15} />{listing.location}</span><strong>₱ {Number(listing.price).toLocaleString('en-PH')}</strong><span className="property-list-card__facts">{listing.bedrooms != null && <span><BedDouble size={16} />{listing.bedrooms} bd</span>}{listing.bathrooms != null && <span><Bath size={16} />{listing.bathrooms} ba</span>}{listing.floorArea != null && <span><Maximize2 size={15} />{listing.floorArea} m²</span>}</span>
        <span className="property-list-card__facts"><button type="button" onClick={() => requireAccount(listing, 'login')}>Message agent</button><button type="button" onClick={() => requireAccount(listing, 'signup')}>See details</button><button type="button" onClick={() => remove(listing.id)}>Remove</button></span></span>
    </article>)}</section>
    {!loading && !error && !homes.length && <p className="map-empty">No saved homes yet. <Link to="/visitor">Browse homes</Link> and tap “Save this home”.</p>}
  </main>;
}
