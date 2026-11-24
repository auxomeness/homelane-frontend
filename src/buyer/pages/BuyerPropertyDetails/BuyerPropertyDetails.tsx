import './BuyerPropertyDetails.css';
import { useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, Bath, BedDouble, Bookmark, Check, MapPin, Ruler, X } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router';
import Button from '../../../components/button.js';
import { buyerListings } from '../../data/listings.js';
import { savePreviewNotification } from '../../data/previewNotifications.js';
import { useSavedProperties } from '../../hooks/useSavedProperties.js';

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
  const { savedPropertyIds, toggleSavedProperty } = useSavedProperties();
  const [showContact, setShowContact] = useState(false);
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerNotice, setOfferNotice] = useState('');
  const listing = buyerListings.find((item) => item.id === propertyId);
  const isSaved = listing ? savedPropertyIds.includes(listing.id) : false;

  if (!listing) return <Navigate to="/buyer/properties" replace />;

  function submitOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const offerListing = listing;
    if (!offerListing) return;
    const amount = Number(offerAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const formattedAmount = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 }).format(amount);
    savePreviewNotification({
      id: `offer-${Date.now()}`,
      category: 'Offers',
      title: 'Offer submitted',
      description: `Preview offer: ₱${formattedAmount} for ${offerListing.title}. It has not been sent to the agent.`,
      time: 'Just now',
      initials: '₱',
      destination: `/buyer/properties/${offerListing.id}`,
      unread: true,
    });
    setOfferNotice('Offer submitted in this preview.');
    setOfferAmount('');
    setIsOfferOpen(false);
  }

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
              onClick={() => toggleSavedProperty(listing.id)}
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

          {isSaved && <p className="buyer-property-details__saved-note" role="status"><Check size={15} aria-hidden="true" /> Saved in this browser</p>}

          <div className="buyer-property-details__actions">
            <Link className="buyer-property-details__action buyer-property-details__action--secondary" to={`/buyer/messages?property=${encodeURIComponent(listing.id)}`}>Inquire</Link>
            <button
              className="buyer-property-details__action buyer-property-details__action--secondary buyer-property-details__action-button"
              type="button"
              onClick={() => {
                setOfferAmount('');
                setOfferNotice('');
                setIsOfferOpen(true);
              }}
            >
              Offer
            </button>
            <Link className="buyer-property-details__action buyer-property-details__action--primary" to={`/buyer/viewings?property=${encodeURIComponent(listing.id)}&request=1`}>Request a viewing</Link>
          </div>
          {offerNotice && <p className="buyer-property-details__offer-success" role="status"><Check size={15} aria-hidden="true" /> {offerNotice}</p>}
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

      {isOfferOpen && (
        <div className="buyer-property-details__offer-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsOfferOpen(false);
        }}>
          <section className="buyer-property-details__offer-dialog" role="dialog" aria-modal="true" aria-labelledby="buyer-property-offer-title">
            <div className="buyer-property-details__offer-heading">
              <div>
                <h2 id="buyer-property-offer-title">Send an offer to KA?</h2>
                <p>Input your proposed amount in PHP.</p>
              </div>
              <button className="buyer-property-details__offer-close" type="button" aria-label="Close offer form" onClick={() => setIsOfferOpen(false)}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <form className="buyer-property-details__offer-form" onSubmit={submitOffer}>
              <label htmlFor="buyer-offer-amount">Offer Amount</label>
              <div className="buyer-property-details__offer-input-wrap">
                <span aria-hidden="true">₱</span>
                <input
                  id="buyer-offer-amount"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  placeholder="Price"
                  required
                  value={offerAmount}
                  onChange={(event) => setOfferAmount(event.target.value)}
                />
              </div>
              <small>Currently listed price is ₱{listing.price.toLocaleString('en-PH')}.</small>
              <Button className="buyer-property-details__offer-submit" type="submit" size="small" shape="pill" fullWidth>
                Send Offer
              </Button>
            </form>
            <p className="buyer-property-details__offer-disclaimer">This offer is a non-binding preview and will not be sent to an agent.</p>
          </section>
        </div>
      )}
    </section>
  );
}
