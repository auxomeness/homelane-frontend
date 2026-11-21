import './BuyerPropertyDetails.css';
import { useState, type ReactNode } from 'react';
import { ArrowLeft, Bath, BedDouble, Bookmark, Check, MapPin, Ruler } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router';
import { buyerListings } from '../../data/listings.js';

const featureSamples: Record<string, string[]> = {
  'pacol-family': ['Garden area', 'Covered parking', 'Gated entry', 'Near schools and shops'],
  'concepcion-home': ['Open-plan living area', 'Covered parking', 'Laundry area', 'Near local shops'],
  'triangulo-condo': ['Building security', 'Elevator access', 'Parking available', 'City-center location'],
  'dayangdang-duplex': ['Private entrance', 'Covered parking', 'Balcony', 'Near public transport'],
  'magsaysay-house': ['Large family kitchen', 'Garden area', 'Two-car parking', 'Near Magsaysay Avenue'],
  'pacol-townhouse': ['New construction', 'Covered parking', 'Private outdoor space', 'Gated community'],
  'pacol-lot': ['Residential zoning', 'Road access', 'Near neighborhood services', 'Level lot'],
};

export default function BuyerPropertyDetails() {
  const { propertyId } = useParams();
  const [isSaved, setIsSaved] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const listing = buyerListings.find((item) => item.id === propertyId);

  if (!listing) return <Navigate to="/buyer/properties" replace />;

  const facts: { label: string; value: string; icon?: ReactNode }[] = [
    { label: 'Property type', value: listing.type },
    { label: 'Floor area', value: `${listing.area} m²`, icon: <Ruler size={16} aria-hidden="true" /> },
    ...(listing.bedrooms == null ? [] : [{ label: 'Bedrooms', value: `${listing.bedrooms}`, icon: <BedDouble size={16} aria-hidden="true" /> }]),
    ...(listing.bathrooms == null ? [] : [{ label: 'Bathrooms', value: `${listing.bathrooms}`, icon: <Bath size={16} aria-hidden="true" /> }]),
    { label: 'Postal code', value: listing.postalCode },
  ];

  return (
    <section className="buyer-property-details" aria-labelledby="buyer-property-title">
      <Link className="buyer-property-details__back" to="/buyer/properties"><ArrowLeft size={16} aria-hidden="true" /> Back to properties</Link>

      <div className="buyer-property-details__top-grid">
        <div className="buyer-property-details__gallery" aria-label={`Photos of ${listing.title}`}>
          <div className="buyer-property-details__photo buyer-property-details__photo--main">Property photo</div>
          <div className="buyer-property-details__photo buyer-property-details__photo--side">Property photo</div>
          <div className="buyer-property-details__photo buyer-property-details__photo--side">Property photo</div>
          <span className="buyer-property-details__photo-count">3 photos · Preview</span>
        </div>

        <aside className="buyer-property-details__summary">
          <div className="buyer-property-details__summary-heading">
            <span className="buyer-property-details__type">For sale · {listing.type}</span>
            <button
              className={`buyer-property-details__save${isSaved ? ' is-saved' : ''}`}
              type="button"
              aria-pressed={isSaved}
              aria-label={isSaved ? 'Remove from saved homes' : 'Save this home'}
              onClick={() => setIsSaved((saved) => !saved)}
            >
              <Bookmark size={19} fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
            </button>
          </div>
          <h1 id="buyer-property-title">{listing.title}</h1>
          <p className="buyer-property-details__price">₱{listing.price.toLocaleString('en-PH')}</p>
          <p className="buyer-property-details__location"><MapPin size={16} aria-hidden="true" /> {listing.location}</p>
          <div className="buyer-property-details__quick-facts">
            {listing.bedrooms != null && <span><BedDouble size={16} aria-hidden="true" /> {listing.bedrooms} beds</span>}
            {listing.bathrooms != null && <span><Bath size={16} aria-hidden="true" /> {listing.bathrooms} baths</span>}
            <span><Ruler size={16} aria-hidden="true" /> {listing.area} m²</span>
          </div>

          <div className="buyer-property-details__agent">
            <span className="buyer-property-details__avatar" aria-hidden="true">KA</span>
            <div className="buyer-property-details__agent-info">
              <strong>Real estate agent KA</strong>
              <button type="button" onClick={() => setShowContact((visible) => !visible)}>
                {showContact ? 'Hide contact details' : 'View contact details'}
              </button>
              {showContact && <span className="buyer-property-details__contact">KA · agent contact preview</span>}
            </div>
          </div>

          {isSaved && <p className="buyer-property-details__saved-note" role="status"><Check size={15} aria-hidden="true" /> Saved in this preview</p>}

          <div className="buyer-property-details__actions">
            <Link className="buyer-property-details__action buyer-property-details__action--secondary" to={`/buyer/messages?property=${encodeURIComponent(listing.id)}`}>Inquire</Link>
            <Link className="buyer-property-details__action buyer-property-details__action--secondary" to={`/buyer/offers?property=${encodeURIComponent(listing.id)}`}>Offer</Link>
            <Link className="buyer-property-details__action buyer-property-details__action--primary" to={`/buyer/viewings?property=${encodeURIComponent(listing.id)}&request=1`}>Request a viewing</Link>
          </div>
          <p className="buyer-property-details__disclaimer">Property and agent information shown here is fictional preview content.</p>
        </aside>
      </div>

      <div className="buyer-property-details__lower-grid">
        <section className="buyer-property-details__info-panel" aria-labelledby="buyer-property-features-title">
          <h2 id="buyer-property-features-title">Features</h2>
          <ul className="buyer-property-details__features">
            {(featureSamples[listing.id] ?? ['Property details available soon']).map((feature) => <li key={feature}><Check size={15} aria-hidden="true" />{feature}</li>)}
          </ul>
        </section>

        <section className="buyer-property-details__info-panel" aria-labelledby="buyer-property-facts-title">
          <h2 id="buyer-property-facts-title">Facts</h2>
          <dl className="buyer-property-details__facts">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.icon}{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </section>
  );
}
