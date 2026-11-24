import './BuyerSaved.css';
import { ArrowLeft, Bookmark, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import Button from '../../../components/button.js';
import Card from '../../components/PropertyCard.js';
import { buyerListings } from '../../data/listings.js';
import { useSavedProperties } from '../../hooks/useSavedProperties.js';

export default function BuyerSaved() {
  const navigate = useNavigate();
  const { savedPropertyIds, toggleSavedProperty } = useSavedProperties();
  const savedListings = buyerListings.filter((listing) => savedPropertyIds.includes(listing.id));

  return (
    <section className="buyer-saved" aria-labelledby="buyer-saved-title">
      <Link className="buyer-saved__back" to="/buyer/properties">
        <ArrowLeft size={16} aria-hidden="true" /> Back to properties
      </Link>
      <div className="buyer-page-heading">
        <div>
          <p className="buyer-eyebrow">Buyer workspace</p>
          <h1 id="buyer-saved-title">Saved properties</h1>
        </div>
      </div>

      {savedListings.length > 0 ? (
        <>
          <p className="buyer-saved__count">{savedListings.length} saved {savedListings.length === 1 ? 'home' : 'homes'}</p>
          <div className="buyer-saved__grid">
            {savedListings.map((listing) => (
              <div className="buyer-saved__card" key={listing.id}>
                <Card
                  className="buyer-property-card"
                  placeholderText="Property photo"
                  status="For sale"
                  price={listing.price}
                  title={listing.title}
                  location={listing.location}
                  bedrooms={listing.bedrooms}
                  bathrooms={listing.bathrooms}
                  area={listing.area}
                  areaUnit="m²"
                  saved
                  onSave={() => toggleSavedProperty(listing.id)}
                />
                <Link className="buyer-saved__card-open" to={`/buyer/properties/${listing.id}`} aria-label={`View ${listing.title}`} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="buyer-saved__empty" role="status">
          <span className="buyer-saved__empty-icon" aria-hidden="true"><Bookmark size={25} /></span>
          <h2>No saved properties yet</h2>
          <p>Save homes you like, and they’ll be collected here in this browser.</p>
          <Button className="buyer-saved__empty-button" onClick={() => navigate('/buyer/properties')}>
            <Search size={16} aria-hidden="true" /> Find properties
          </Button>
        </div>
      )}
    </section>
  );
}
