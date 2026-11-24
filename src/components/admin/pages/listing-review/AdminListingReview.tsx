import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import AdminHeader from '../../shared/AdminHeader';
import AdminNavigation from '../../shared/AdminNavigation';
import { getAdminListingsPage, type AdminListingsPage } from '../../../../shared/maps/listingsApi.js';
import { ListReviewGrid } from '../../shared/ReviewGrid.js';
import './adminListingReviewStyles.css';

const pageSize = 20;
export default function AdminListingReview() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const statusParam = params.get('status');
  const queueStatus = statusParam === 'pending' || statusParam === 'active' || statusParam === 'rejected' || statusParam === 'draft' ? statusParam : 'all';
  const searchQuery = params.get('q') ?? '';
  const requestedPage = Number(params.get('page') ?? '1');
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [queue, setQueue] = useState<AdminListingsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const message = (location.state as { message?: string } | null)?.message ?? '';
  const pageCount = Math.max(1, Math.ceil((queue?.total ?? 0) / pageSize));

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAdminListingsPage({ status: queueStatus, q: searchQuery.trim().slice(0, 100), page, pageSize })
      .then((result) => { if (active) { setQueue(result); setError(''); } })
      .catch((reason: unknown) => { if (active) { setQueue(null); setError(reason instanceof Error ? reason.message : 'Unable to load listings.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, queueStatus, searchQuery, refreshKey]);

  const updatePage = (value: string) => {
    setParams((old) => {
      const next = new URLSearchParams(old);
      next.set('page', value);
      return next;
    });
  };

  const updateFilter = (key: 'status' | 'q', value: string) => setParams((old) => {
    const next = new URLSearchParams(old);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    next.delete('page');
    return next;
  });

  return <div className="listing-container admin-layout">
    <AdminHeader />
    <AdminNavigation />
    <main className="admin-page-content">
      <div id="listing-header"><h1>Listing reviews</h1>
      <p>Review property details and verify exact map pins.</p>
      </div>

      <div className="listing-review-actions">
        <Link to={'/admin/map' + (params.size ? '?' + params : '')}>Map</Link>
        <Link className="listing-review-actions__primary" to="/admin/add-listing">+ Add listing</Link>
      </div>
      <div className="listing-filter">
        <label>Status <select value={queueStatus} onChange={(event) => updateFilter('status', event.target.value)}>
          <option value="all">All</option><option value="pending">Pending</option><option value="active">Active</option>
          <option value="rejected">Rejected</option><option value="draft">Draft</option>
        </select></label>
        <label>Search <input value={searchQuery} maxLength={100} onChange={(event) => updateFilter('q', event.target.value)} placeholder="Title or location" /></label>
      </div>
      {message && <p className="listing-review-result" role="status">{message}</p>}

      {error && <p className="account-login-error" role="alert">{error} <button type="button" onClick={() => setRefreshKey((value) => value + 1)}>Retry</button></p>}

      <section className="review-grid-container">
        <header className="review-grid-container-header"><div><h2>Review queue</h2><p>Select a listing to view its details and record a decision.</p></div>
        <span>{queue ? `${queue.total} listings` : loading ? 'Loading…' : 'Unavailable'}</span>
        </header>

        <header className="review-grid-container-labels"><span>Listing</span>
        <span>Location</span>
        <span>Price</span>
        <span>Status</span></header>
        {loading ? <p className="review-empty" role="status">Loading listings…</p> : error ? null :
          queue?.listings.length ? queue.listings.map((listing) => <ListReviewGrid
            key={listing.id} id={listing.id} image={listing.photos[0] ?? ''} title={listing.title}
            location={listing.location} intPrice={listing.price} status={listing.status}
          />) : <p className="review-empty">No listings match these filters.</p>}
        {queue && pageCount > 1 && <nav className="listing-queue-pages" aria-label="Listing pages">
          <button type="button" disabled={page <= 1} onClick={() => updatePage(String(page - 1))}>Previous</button>
          <span>Page {page} of {pageCount}</span>
          <button type="button" disabled={page >= pageCount} onClick={() => updatePage(String(page + 1))}>Next</button>
        </nav>}
      </section>
    </main>
  </div>;
}
