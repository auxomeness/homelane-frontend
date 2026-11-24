import { ArrowLeft, House } from "lucide-react";
import { useEffect, useState } from "react";
import { getAdminListing, reviewListing, type AdminListing, type ListingStatus } from "../../../shared/maps/listingsApi.js";
import { Link, useParams } from "react-router";
import { decideAgentApplication, downloadAgentCertificate, getAgentApplication, type AgentApplication } from "../../../shared/agents/agentsApi.js";
import AdminHeader from "./AdminHeader";
import AdminNavigation from "./AdminNavigation";

import './sharedStyles.css';



export function AdminAgentDetails() {
    const { agentId } = useParams<{ agentId: string }>();
    const [application, setApplication] = useState<AgentApplication | null>(null);
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!agentId) return;
        let active = true;
        setLoading(true);
        getAgentApplication(agentId)
            .then((result) => { if (active) { setApplication(result); setError(''); } })
            .catch((reason: unknown) => {
                if (active) { setApplication(null); setError(reason instanceof Error ? reason.message : 'Unable to load application.'); }
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [agentId]);

    const decide = async (status: 'approved' | 'rejected') => {
        if (!application || application.status !== 'pending' || saving) return;
        const note = feedback.trim();
        if (status === 'rejected' && note.length < 10) {
            setError('Provide at least 10 characters of feedback for a rejection.');
            return;
        }
        setSaving(true);
        setError('');
        setMessage('');
        try {
            const updated = await decideAgentApplication(application.id, status, note || null);
            setApplication(updated);
            setMessage(status === 'approved' ? 'Application approved. The agent login is active.' : 'Application rejected.');
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Unable to save decision.');
            try { setApplication(await getAgentApplication(application.id)); } catch { /* Keep original error visible. */ }
        } finally { setSaving(false); }
    };

    const download = async () => {
        if (!application) return;
        setError('');
        try { await downloadAgentCertificate(application.id); }
        catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to download certificate.'); }
    };

    const initials = application?.fullName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
    return <main className="agent-details-container admin-layout">
        <AdminHeader />
        <AdminNavigation />
        <div className="admin-page-content agent-details-body">
            <Link className="details-back" to="/admin/agent-reviews"><ArrowLeft size={16} /><span>Back to agent reviews</span></Link>
            <header className="agent-details-header"><h1>Agent application</h1><p>Check the applicant profile, license, and certificate before deciding.</p></header>
            {error && <p className="account-login-error" role="alert">{error}</p>}
            {message && <p className="agent-review-result" role="status">{message}</p>}
            {loading ? <p className="agent-details-empty" role="status">Loading application...</p> :
              !application ? error ? null : <p className="agent-details-empty">Application not found.</p> : <>
                <section className="agent-content">
                    <div className="agent-summary-identity">
                        <div className="agent-profile">{initials}</div>
                        <div className="agent-name">
                            <h2>{application.fullName}</h2>
                            <p>{application.city} / Submitted {new Date(application.createdAt).toLocaleDateString('en-PH')}</p>
                        </div>
                    </div>
                    <div className="agent-status">
                        <span className={'agent-status-pill agent-status-pill--' + application.status}>{application.status}</span>
                    </div>
                </section>
                <div className="agent-details-grid">
                    <div className="agent-details-main">
                        <section className="agent-details-card">
                            <h2>Profile</h2>
                            <dl className="agent-details-fields">
                                <div><dt>Email</dt><dd>{application.email}</dd></div>
                                <div><dt>Mobile number</dt><dd>{application.mobileNumber}</dd></div>
                                <div><dt>City</dt><dd>{application.city}</dd></div>
                            </dl>
                        </section>
                        <section className="agent-details-card">
                            <h2>Credentials</h2>
                            <dl className="agent-details-fields">
                                <div><dt>License number</dt><dd>{application.licenseNumber}</dd></div>
                                <div><dt>License expiry</dt><dd>{application.licenseExpiry}</dd></div>
                            </dl>
                            <button type="button" className="agent-certificate-button" disabled={!application.hasCertificate} onClick={download}>Download certificate</button>
                        </section>
                    </div>
                    <div className="agent-details-side">
                        <section className="agent-details-card">
                            <h2>Feedback</h2>
                            {application.status === 'pending' ?
                                <><label htmlFor="agent-feedback">Reason for rejection, or optional approval note</label>
                                <textarea id="agent-feedback" value={feedback} maxLength={1000} onChange={(event) => setFeedback(event.target.value)} placeholder="Explain any concerns for the applicant" /></> :
                                <p>{application.feedback || 'No feedback recorded.'}</p>}
                        </section>
                        <section className="agent-details-card">
                            <h2>Record decision</h2>
                            <p>{application.status === 'pending' ? 'Approval creates the agent login account using the applicant password.' : 'This application has already been reviewed.'}</p>
                            <div className="agent-decision-actions">
                                <button type="button" className="agent-decision-reject" disabled={application.status !== 'pending' || saving} onClick={() => decide('rejected')}>Reject</button>
                                <button type="button" className="agent-decision-approve" disabled={application.status !== 'pending' || saving} onClick={() => decide('approved')}>Approve</button>
                            </div>
                        </section>
                    </div>
                </div>
            </>}
        </div>
    </main>;
}

export function AdminListingDetails() {
    const { listId } = useParams<{ listId: string }>();
    const [listing, setListing] = useState<AdminListing | null>(null);
    const [decision, setDecision] = useState<ListingStatus>('active');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!listId) return;
        let active = true;
        setLoading(true);
        setError('');
        getAdminListing(listId)
            .then((result) => {
                if (active) {
                    setListing(result);
                    setDecision(result.status === 'pending' ? 'active' : result.status);
                }
            })
            .catch((reason: unknown) => {
                if (active) { setListing(null); setError(reason instanceof Error ? reason.message : 'Unable to load listing.'); }
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [listId]);

    const decide = async () => {
        if (!listing || listing.status !== 'pending' || saving) return;
        setSaving(true);
        setError('');
        setMessage('');
        try {
            const updated = await reviewListing(listing.id, decision, listing.latitude, listing.longitude);
            setListing((current) => current ? { ...current, ...updated } : current);
            setMessage(decision === 'active' ? 'Listing approved and published.' :
                decision === 'rejected' ? 'Listing correction requested.' : 'Listing kept pending.');
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Unable to save review.');
            if (listId) {
                try { setListing(await getAdminListing(listId)); } catch { /* Preserve the original error. */ }
            }
        } finally {
            setSaving(false);
        }
    };

    return <main className="listing-details-container admin-layout">
        <AdminHeader />
        <AdminNavigation />
        <div className="admin-page-content listing-details-body">
            <Link className="listing-details-back" to="/admin/listing-reviews"><ArrowLeft size={16} /><span>Back to listing reviews</span></Link>
            <header className="list-details-header"><h1>Listing details</h1><p>Review the property facts, submitter, and submitted location.</p></header>
            {error && <p className="account-login-error" role="alert">{error}</p>}
            {message && <p className="listing-review-result" role="status">{message}</p>}
            {loading ? <p className="listing-details-empty" role="status">Loading listing...</p> :
              !listing ? error ? null : <p className="listing-details-empty">Listing not found.</p> : <>
                <div className="listing-details-title">
                    <h2>{listing.title}</h2>
                    <span className={'listing-details-status listing-details-status--' + listing.status}>{listing.status}</span>
                </div>
                <div className="listing-details-grid">
                    <section className="listing-property-card">
                        <div className="listing-property-photo">
                            {listing.photos[0] ? <img src={listing.photos[0]} alt={listing.title} /> : <House size={36} strokeWidth={1.5} />}
                        </div>
                        <strong className="listing-property-price">PHP {listing.price.toLocaleString('en-PH')}</strong>
                        <p className="listing-property-location">{listing.location}</p>
                        <div className="listing-property-facts">
                            {listing.propertyType}
                            {listing.bedrooms !== null && ' / ' + listing.bedrooms + ' bedrooms'}
                            {listing.bathrooms !== null && ' / ' + listing.bathrooms + ' bathrooms'}
                            {listing.floorArea !== null && ' / ' + listing.floorArea + ' m2'}
                        </div>
                        <p>{listing.description}</p>
                        {listing.photos.length > 1 && <p>{listing.photos.length} photos submitted</p>}
                    </section>
                    <div className="listing-details-side">
                        <section className="listing-details-card">
                            <h3>Submitted by</h3>
                            <div className="listing-assigned-agent">{listing.agent.email}</div>
                            <div className="listing-agent-submission">
                                <span>Submitted</span>
                                <span className="listing-submission-status">{new Date(listing.createdAt).toLocaleString('en-PH')}</span>
                            </div>
                        </section>
                        <section className="listing-details-card">
                            <h3>Location</h3>
                            <span className="listing-details-label">Submitted location</span>
                            <p>{listing.location}</p>
                            <p>Latitude {listing.latitude}, longitude {listing.longitude}</p>
                            <Link to={'/admin/map?selected=' + encodeURIComponent(listing.id)}>Inspect or adjust pin on map</Link>
                        </section>
                        <section className="listing-details-card">
                            <h3>Record decision</h3>
                            <p className="listing-decision-copy">{listing.status === 'pending' ? 'Review the property details and submitted pin, then record a decision.' : `This listing review is complete with a ${listing.status} status.`}</p>
                            {listing.status === 'pending' && <>
                                <div className="listing-review-options" role="group" aria-label={`Decision for ${listing.title}`}>
                                    {([['active', 'Approve and publish'], ['rejected', 'Request correction'], ['pending', 'Keep pending']] as const).map(([value, label]) =>
                                        <label key={value} className={decision === value ? 'is-selected' : ''}>
                                            <input type="radio" name="listing-review-decision" value={value} checked={decision === value} onChange={() => setDecision(value)} />
                                            <span>{label}</span>
                                        </label>)}
                                </div>
                                <button type="button" className="listing-review-save" disabled={saving} onClick={decide}>{saving ? 'Saving review…' : 'Save review'}</button>
                            </>}
                        </section>
                    </div>
                </div>
            </>}
        </div>
    </main>;
}
