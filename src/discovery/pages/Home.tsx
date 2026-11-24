import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getPublicListings, type PropertyListing } from '../../shared/maps/listingsApi.js';
import StateMessage from '../shared/StateMessage.js';

export default function Home() {
  const [listings, setListings] = useState<PropertyListing[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { getPublicListings().then(setListings).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false)); }, []);
  return <main className="discovery-page discovery-home">
    <header className="discovery-home__heading"><div><span>HOMELANE · BUYER</span><h1>Find a place to call home</h1><p>Explore active homes, connect with agents, and request viewings.</p></div><Link to="/discovery/map">Explore map</Link></header>
    <section><div className="discovery-home__section-heading"><h2>Recently listed</h2><Link to="/discovery/properties">View all</Link></div>
      {loading ? <StateMessage title="Loading homes…" text="Published homes are on their way." kind="loading" /> : error ? <p className="auth-login__error" role="alert">{error}</p> : listings.length ? <div className="property-list-grid">{listings.slice(0, 6).map((home) => <article className="property-list-card" key={home.id}>
        {home.photos[0] ? <img src={home.photos[0]} alt={home.title} /> : <div className="property-list-card__image">⌂</div>}<div><span>{home.propertyType}</span><h3>{home.title}</h3><p>{home.location}</p><strong>₱ {Number(home.price).toLocaleString('en-PH')}</strong><small className="property-list-card__facts">{[home.bedrooms != null && `${home.bedrooms} bd`, home.bathrooms != null && `${home.bathrooms} ba`, home.floorArea != null && `${home.floorArea} m²`].filter(Boolean).join(' · ')}</small><small className="property-list-card__agent">Listed by {home.agentName || 'Homelane agent'}</small><Link to={`/discovery/properties/${encodeURIComponent(home.id)}`}>View details</Link></div>
      </article>)}</div> : <StateMessage title="No active listings yet." text="New homes will appear here once available." />}
    </section>
  </main>;
}
