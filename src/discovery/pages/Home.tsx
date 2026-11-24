import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Bath, BedDouble, MapPin, Maximize2 } from 'lucide-react';
import { getPublicListings, type PropertyListing } from '../../shared/maps/listingsApi.js';
import StateMessage from '../shared/StateMessage.js';

export default function Home() {
  const [listings, setListings] = useState<PropertyListing[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { getPublicListings().then(setListings).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false)); }, []);
  const featured = listings[0];
  return <main className="discovery-page discovery-home">
    <header className="discovery-home__heading"><div className="discovery-home__copy"><span>HOMELANE · BUYER</span><h1>Find a place<br/>that feels like yours.</h1><p>Explore thoughtfully listed homes, connect with local agents, and plan your next move.</p><div className="discovery-home__actions"><Link to="/discovery/properties">Explore homes <ArrowUpRight size={17}/></Link><Link className="is-secondary" to="/discovery/map">Open the map <MapPin size={17}/></Link></div></div><div className="discovery-home__visual" aria-hidden="true">{featured?.photos[0] && <img src={featured.photos[0]} alt=""/>}<div className="discovery-home__visual-note"><span>YOUR NEXT CHAPTER</span><strong>{featured?.location || 'Starts with the right place'}</strong></div><span className="discovery-home__visual-index">01 <i/> HOMES TO EXPLORE</span></div></header>
    <section><div className="discovery-home__section-heading"><h2>Recently listed</h2><Link to="/discovery/properties">View all</Link></div>
      {loading ? <StateMessage title="Loading homes…" text="Published homes are on their way." kind="loading" /> : error ? <p className="auth-login__error" role="alert">{error}</p> : listings.length ? <div className="property-list-grid">{listings.slice(0, 6).map((home) => <article className="property-list-card" key={home.id}>
        <Link className="property-list-card__link" aria-label={`View ${home.title} details`} to={`/discovery/properties/${encodeURIComponent(home.id)}`}>
          <span className="property-list-card__photo">{home.photos[0] ? <img src={home.photos[0]} alt={home.title}/> : <span className="property-list-card__image" aria-hidden="true">⌂</span>}<span className="property-list-card__type">{home.propertyType}</span><span className="property-list-card__photo-hint">View home <ArrowUpRight size={16}/></span></span>
          <span className="property-list-card__body"><span className="property-list-card__title">{home.title}</span><span className="property-list-card__location"><MapPin size={15}/>{home.location}</span><strong>₱ {Number(home.price).toLocaleString('en-PH')}</strong><span className="property-list-card__facts">{home.bedrooms != null && <span><BedDouble size={15}/>{home.bedrooms} bd</span>}{home.bathrooms != null && <span><Bath size={15}/>{home.bathrooms} ba</span>}{home.floorArea != null && <span><Maximize2 size={14}/>{home.floorArea} m²</span>}</span></span>
        </Link>
      </article>)}</div> : <StateMessage title="No active listings yet." text="New homes will appear here once available." />}
    </section>
  </main>;
}
