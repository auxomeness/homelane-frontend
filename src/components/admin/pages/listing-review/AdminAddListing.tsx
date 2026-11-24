import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import AdminHeader from '../../shared/AdminHeader';
import AdminNavigation from '../../shared/AdminNavigation';
import PropertyMap, { type MapPin } from '../../../../shared/maps/PropertyMap.js';
import { createAdminListing } from '../../../../shared/maps/listingsApi.js';
import './adminListingReviewStyles.css';

const initialDetails = {
  title: '', location: '', price: '', propertyType: 'House', description: '',
  bedrooms: '', bathrooms: '', floorArea: '',
};

function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read the photo.'));
    reader.onerror = () => reject(new Error('Could not read the photo.'));
    reader.readAsDataURL(file);
  });
}

export default function AdminAddListing() {
  const navigate = useNavigate();
  const [details, setDetails] = useState(initialDetails);
  const [photos, setPhotos] = useState<string[]>([]);
  const [pin, setPin] = useState<MapPin | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const change = (field: keyof typeof initialDetails, value: string) =>
    setDetails((current) => ({ ...current, [field]: value }));

  const addPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length + photos.length > 4 || files.some((file) => file.size > 1_200_000 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type))) {
      setError('Add up to four PNG, JPEG, or WebP photos, each 1.2 MB or smaller.');
      return;
    }
    try {
      const next = await Promise.all(files.map(readPhoto));
      setPhotos((current) => [...current, ...next]);
      setError('');
    } catch {
      setError('Could not load the selected photos. Please try again.');
    }
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    if (!pin) { setError('Choose the exact property pin on the map.'); return; }
    setSaving(true);
    setError('');
    try {
      await createAdminListing({
        title: details.title.trim(), location: details.location.trim(), price: Number(details.price),
        propertyType: details.propertyType, description: details.description.trim(), photos,
        bedrooms: details.bedrooms === '' ? null : Number(details.bedrooms),
        bathrooms: details.bathrooms === '' ? null : Number(details.bathrooms),
        floorArea: details.floorArea === '' ? null : Number(details.floorArea),
        latitude: pin.latitude, longitude: pin.longitude,
      });
      navigate('/admin/listing-reviews?status=pending', { state: { message: 'Listing added to the review queue.' } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to add listing.');
    } finally {
      setSaving(false);
    }
  };

  return <div className="listing-container admin-layout">
    <AdminHeader />
    <AdminNavigation />
    <main className="admin-page-content admin-add-listing">
      <header className="admin-add-listing__heading">
        <div><h1>Add listing</h1><p>Enter the property details and place its exact map pin.</p></div>
        <Link to="/admin/listing-reviews">Back to reviews</Link>
      </header>
      <form className="admin-add-listing__form" onSubmit={save}>
        <section className="admin-add-listing__card">
          <h2>Property details</h2>
          <div className="admin-add-listing__fields">
            <label className="admin-add-listing__wide">Listing title<input value={details.title} minLength={6} maxLength={100} onChange={(event) => change('title', event.target.value)} placeholder="e.g. Modern three-bedroom townhouse" required /></label>
            <label>Property type<select value={details.propertyType} onChange={(event) => change('propertyType', event.target.value)}><option>House</option><option>Condo</option><option>Townhouse</option><option>Lot</option></select></label>
            <label>Price (PHP)<input type="number" min="1" step="any" value={details.price} onChange={(event) => change('price', event.target.value)} placeholder="8500000" required /></label>
            <label className="admin-add-listing__wide">Location<input value={details.location} onChange={(event) => change('location', event.target.value)} placeholder="Barangay, city, province" required /></label>
            <label>Bedrooms <span>Optional</span><input type="number" min="0" step="1" value={details.bedrooms} onChange={(event) => change('bedrooms', event.target.value)} /></label>
            <label>Bathrooms <span>Optional</span><input type="number" min="0" step="1" value={details.bathrooms} onChange={(event) => change('bathrooms', event.target.value)} /></label>
            <label>Floor area (m²) <span>Optional</span><input type="number" min="0" step="any" value={details.floorArea} onChange={(event) => change('floorArea', event.target.value)} /></label>
            <label className="admin-add-listing__wide">Description<textarea value={details.description} minLength={20} maxLength={2000} onChange={(event) => change('description', event.target.value)} placeholder="Describe the property, features, and nearby amenities" required /></label>
          </div>
        </section>
        <section className="admin-add-listing__card">
          <h2>Photos <span>Optional</span></h2>
          <label className="admin-add-listing__photo-input">Add photos (up to four, 1.2 MB each)<input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={addPhotos} /></label>
          {!!photos.length && <div className="admin-add-listing__photos">{photos.map((photo, index) => <figure key={`${index}-${photo.slice(-18)}`}><img src={photo} alt={`Property photo ${index + 1}`} /><button type="button" aria-label={`Remove photo ${index + 1}`} onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))}>×</button></figure>)}</div>}
        </section>
        <section className="admin-add-listing__card">
          <h2>Exact property location</h2>
          <p>Click the map or drag the pin to choose the property's location.</p>
          <PropertyMap listings={[]} mode="pick" pin={pin} onPinChange={setPin} allowRoute={false} height={340} />
          {pin && <p className="admin-add-listing__coordinates">Pin: {pin.latitude.toFixed(6)}, {pin.longitude.toFixed(6)}</p>}
        </section>
        {error && <p className="account-login-error" role="alert">{error}</p>}
        <footer className="admin-add-listing__footer">
          <p>New listings enter the pending review queue.</p>
          <button type="submit" disabled={saving}>{saving ? 'Adding listing…' : 'Add listing'}</button>
        </footer>
      </form>
    </main>
  </div>;
}
