import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import AdminHeader from '../../shared/AdminHeader';
import AdminNavigation from '../../shared/AdminNavigation';
import { getStaffListings, reviewListing, type ListingStatus, type PropertyListing } from '../../../../shared/maps/listingsApi.js';
import './adminListingReviewStyles.css';
import { ListReviewGrid } from '../../shared/ReviewGrid.js';
import { listData } from '../../libs/listData.js';

export default function AdminListingReview() {
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [params] = useSearchParams();
  const [status, setStatus] = useState<ListingStatus>('active');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const reviewDialogRef = useRef<HTMLDialogElement>(null);
  const reviewGridRef = useRef<HTMLElement>(null);
  const selected = listings.find((item) => item.id === selectedId) ?? null;

  const pendingCount = listings.filter((item) => item.status === 'pending' || item.status === 'rejected').length;
  
  useEffect(() => {
    let active = true;
    getStaffListings()
      .then((data) => {
        if (!active) return;
        setListings(data);
        setSelectedId(data.find((item) => item.status === 'pending')?.id ?? data[0]?.id ?? '');
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load listings.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (selected) setStatus(selected.status === 'rejected' ? 'rejected' : 'active');
  }, [selectedId]);

  const save = async () => {
    if (!selected || saving) return;
    setMessage('');
    setError('');
    setSaving(true);

    try {
      const updated = await reviewListing(selected.id, status, selected.latitude, selected.longitude);
      setListings((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(`Review and submitted pin saved for ${updated.title}.`);
      reviewDialogRef.current?.close();

    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save review.');
    } finally {
      setSaving(false);
    }
  };

  const openReview = () => {
    const dialog = reviewDialogRef.current;
    if (!dialog || dialog.open) return;
    const bounds = reviewGridRef.current?.getBoundingClientRect();
    if (bounds) {
      const top = Math.min(Math.max(16, bounds.top + 16), Math.max(16, window.innerHeight - 480));
      const right = Math.max(16, window.innerWidth - bounds.right + 16);
      dialog.style.setProperty('--admin-review-top', `${top}px`);
      dialog.style.setProperty('--admin-review-right', `${right}px`);
    }
    dialog.showModal();
  };
  
  return (
  <div className="listing-container admin-layout">
      <AdminHeader/>
      <AdminNavigation/>

      <main className="admin-page-content">
      
      <div id="listing-header">
        <h1>Listing reviews</h1>
        <p>Review property details and verify exact map pins.</p>
      </div>
    
        <div className="listing-review-actions">
          <Link to={`/admin/map${params.size ? `?${params}` : ''}`}>Map</Link>
          <button type="button" onClick={openReview}>Review listing</button>
        </div>
        
    <section className='review-grid-container' ref={reviewGridRef}>
      <header className="review-grid-container-header">
          <h2>Review queue</h2>
          <span>{listData.length} listings</span>
      </header>

    <dialog className="admin-map-review" ref={reviewDialogRef}>
      <div className="admin-map-review__heading">
        <div>
          <h2>Review listing</h2>
          <p>Choose a listing, confirm its submitted pin, then record a decision.</p>
        </div>
        <button type="button" onClick={() => reviewDialogRef.current?.close()}>Close</button>
      </div>

      <div className="admin-review-step">
        <div className="admin-review-step__heading"><span>1</span><h3>Choose a listing</h3></div>
        <label htmlFor="review-listing">Listing to review</label>
        <select id="review-listing" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} disabled={loading || !listings.length}>
          <option value="">{loading ? 'Loading listings…' : 'Choose a listing'}</option>
          {listings.map((item) => <option value={item.id} key={item.id}>{item.title} · {item.status}</option>)}
        </select>
        {!loading && !listings.length && <p className="admin-review-hint">No submitted listings are available to review.</p>}
      </div>

      {selected && <>
        <div className="admin-review-step">
          <div className="admin-review-step__heading"><span>2</span><h3>Confirm the submitted pin</h3></div>
          <div className="admin-review-property">
            <strong>{selected.title}</strong>
            <span>{selected.location} · ₱ {Number(selected.price).toLocaleString('en-PH')}</span>
          </div>
          <dl className="admin-review-coordinates">
            <div><dt>Latitude</dt><dd>{selected.latitude.toFixed(6)}</dd></div>
            <div><dt>Longitude</dt><dd>{selected.longitude.toFixed(6)}</dd></div>
          </dl>
          <p className="admin-review-hint">These coordinates will be saved with your decision. To move the pin, close this panel and use Map.</p>
        </div>

        <div className="admin-review-step">
          <div className="admin-review-step__heading"><span>3</span><h3>Record a decision</h3></div>
          <label htmlFor="review-status">Decision</label>
          <select id="review-status" value={status} onChange={(event) => setStatus(event.target.value as ListingStatus)}>
            <option value="active">Approve and publish</option>
            <option value="rejected">Request correction</option>
            <option value="pending">Keep pending</option>
          </select>
        </div>
      </>}

      {error && <p className="staff-login-error" role="alert">{error}</p>}

      <div className="admin-review-footer">
        <p>{pendingCount} pending or correction listings · {listings.length} total</p>
        <button type="button" className="admin-map-review__save" onClick={save} disabled={!selected || saving}>
          {saving ? 'Saving review…' : 'Save review and exact pin'}
        </button>
      </div>
    </dialog>

    {message && <p className="listing-review-result" role="status">{message}</p>}

      {listData.map((list) => (
        <ListReviewGrid
          key={list.id}
          id={Number(list.id)}
          image={list.image}
          title={list.title}
          location={list.location}
          intPrice={list.intPrice}
          status={list.status}
        />
      ))}
    </section>
      </main>
  </div>);
}
