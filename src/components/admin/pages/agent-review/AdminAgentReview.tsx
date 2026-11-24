import { useEffect, useRef, useState, type FormEvent } from 'react';
import AdminHeader from '../../shared/AdminHeader';
import AdminNavigation from '../../shared/AdminNavigation';
import CategoryFilter from '../../../CategoryFilter';
import SearchFilter from '../../../SearchFIlter';
import { AgentReviewGrid } from '../../shared/ReviewGrid';
import { addAgentApplication, getAgentApplicationsPage, type AgentApplicationPage } from '../../../../shared/agents/agentsApi.js';
import type { CategoryStatus } from '../../libs/listData';
import './adminAgentReviewStyles.css';

const pageSize = 20;

export default function AdminAgentReview() {

  const [selectedCategory, setSelectedCategory] = useState<CategoryStatus>('Pending');
  const [searchQuery, setSearchQuery] = useState('');

  const [page, setPage] = useState(1);
  const [result, setResult] = useState<AgentApplicationPage | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const status = selectedCategory === 'All' ? 'all' : selectedCategory.toLowerCase() as 'pending' | 'approved' | 'rejected';

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAgentApplicationsPage({ status, q: searchQuery.trim().slice(0, 100), page, pageSize })
      .then((data) => { if (active) { setResult(data); setError(''); } })
      .catch((reason: unknown) => {
        if (active) { setResult(null); setError(reason instanceof Error ? reason.message : 'Unable to load applications.'); }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [status, searchQuery, page, refreshKey]);

  const addAgent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const certificate = data.get('certificate');
    const password = String(data.get('password') ?? '');
    if (!(certificate instanceof File) || !certificate.size || certificate.size > 5 * 1024 * 1024 ||
      !['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(certificate.type)) {
      setFormError('Attach a PDF, JPEG, PNG, or WebP certificate up to 5 MB.');
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setFormError('Use a password of at most 72 UTF-8 bytes.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await addAgentApplication({
        fullName: String(data.get('fullName') ?? '').trim(),
        email: String(data.get('email') ?? '').trim(),
        mobileNumber: String(data.get('mobileNumber') ?? '').trim(),
        city: String(data.get('city') ?? '').trim(),
        licenseNumber: String(data.get('licenseNumber') ?? '').trim(),
        licenseExpiry: String(data.get('licenseExpiry') ?? ''),
        password,
        certificate,
      });
      form.reset();
      dialogRef.current?.close();
      setMessage('Agent application added to the review queue.');
      setSelectedCategory('Pending');
      setSearchQuery('');
      setPage(1);
      setRefreshKey((value) => value + 1);
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : 'Unable to add the agent application.');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil((result?.total ?? 0) / pageSize));

  return <main className="agent-container admin-layout">
    <AdminHeader />
    <AdminNavigation />
    <div className="admin-page-content">
      <header id="agent-header"><h1>Agent reviews</h1><p>Manage and review agent applications</p></header>
      <div className="agent-filter">
        <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={(value) => { setSelectedCategory(value); setPage(1); }} />
        <div className="agent-filter__actions">
          <SearchFilter searchQuery={searchQuery} onSearchChange={(value) => { setSearchQuery(value); setPage(1); }} placeholder="agents" />
          <button type="button" className="agent-filter__add" onClick={() => { setFormError(''); dialogRef.current?.showModal(); }}>+ Add agent</button>
        </div>
      </div>

      {message && <p className="agent-review-result" role="status">{message}</p>}
      {error && <p className="account-login-error" role="alert">{error} <button type="button" onClick={() => setRefreshKey((value) => value + 1)}>Retry</button></p>}
      <section className="review-grid-container">
        <header className="review-grid-container-header"><h2>Review queue</h2>
        <span>{result ? `${result.total} submissions` : loading ? 'Loading…' : 'Unavailable'}</span>
        </header>

        <header className="review-grid-container-labels">
            <span>Agent</span>
            <span>City</span>
            <span>Submitted</span>
            <span>Status</span>
        </header>

        {loading ? <p className="review-empty" role="status">Loading applications…</p> : error ? null :
          result?.applications.length ? result.applications.map((application) =>
            <AgentReviewGrid key={application.id} id={application.id}
              image=""
              name={application.fullName} location={application.city}
              submission={new Date(application.createdAt).toLocaleDateString('en-PH')}
              status={application.status} />
          ) : <p className="review-empty">No applications match your filters.</p>}
        {result && totalPages > 1 && <nav className="agent-application-pages" aria-label="Application pages">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </nav>}
      </section>

      <dialog ref={dialogRef} className="admin-agent-dialog" onCancel={() => setFormError('')}>
        <header className="admin-agent-dialog__heading">
          <div><h2>Add agent</h2><p>Enter the agent profile and license details required for review.</p></div>
          <button type="button" onClick={() => dialogRef.current?.close()}>Close</button>
        </header>
        <form onSubmit={addAgent}>
          <fieldset className="admin-agent-dialog__section">
            <legend>Agent details</legend>
            <div className="admin-agent-dialog__fields">
              <label>Full name<input name="fullName" minLength={2} maxLength={100} autoComplete="name" required /></label>
              <label>Email<input name="email" type="email" maxLength={254} autoComplete="email" required /></label>
              <label>Mobile number<input name="mobileNumber" type="tel" minLength={7} maxLength={25} autoComplete="tel" required /></label>
              <label>City<input name="city" minLength={2} maxLength={100} autoComplete="address-level2" required /></label>
            </div>
          </fieldset>
          <fieldset className="admin-agent-dialog__section">
            <legend>License and account</legend>
            <div className="admin-agent-dialog__fields">
              <label>License number<input name="licenseNumber" minLength={3} maxLength={60} required /></label>
              <label>License expiry<input name="licenseExpiry" type="date" min={new Date().toISOString().slice(0, 10)} required /></label>
              <label className="admin-agent-dialog__wide">License certificate <span>PDF or image, up to 5 MB</span><input name="certificate" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" required /></label>
              <label className="admin-agent-dialog__wide">Agent password <span>Used to sign in after approval; at least 12 characters</span><input name="password" type="password" minLength={12} maxLength={72} autoComplete="new-password" required /></label>
            </div>
          </fieldset>
          {formError && <p className="admin-agent-dialog__error" role="alert">{formError}</p>}
          <footer className="admin-agent-dialog__footer">
            <span>The application will be added with pending status.</span>
            <button type="submit" disabled={saving}>{saving ? 'Adding agent…' : 'Add agent'}</button>
          </footer>
        </form>
      </dialog>
    </div>
  </main>;
}
