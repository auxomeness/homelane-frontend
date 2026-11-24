import { ArrowRight, CircleAlert, Clock3, House, Layers3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import Button from '../../../button.js';
import AgentMetricCard from '../../dashboard/AgentMetricCard.js';
import AgentListingCard from '../../listings/AgentListingCard.js';
import type { AgentListingData } from '../../libs/listData.js';
import { getAgentDashboard, type AgentDashboardData } from '../../../../shared/agent/dashboardApi.js';
import './dashboardStyles.css';

function asCardListing(listing: AgentDashboardData['recentListings'][number]): AgentListingData {
  const labels = {
    active: ['Active / Live', 'View listing'],
    pending: ['Pending review', 'View listing'],
    rejected: ['Action required', 'Edit listing'],
    draft: ['Draft', 'Edit listing'],
  };
  const [statusLabel, actionLabel] = labels[listing.status];
  return { ...listing, price: `₱ ${listing.price.toLocaleString('en-PH')}`, statusLabel, actionLabel };
}

export default function AgentDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<AgentDashboardData | null>(null);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    getAgentDashboard()
      .then((data) => { if (active) { setDashboard(data); setError(''); } })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load dashboard.'); });
    return () => { active = false; };
  }, [refresh]);
  const counts = dashboard?.counts;
  const displayCount = (value?: number) => value === undefined ? error ? '—' : '…' : String(value);
  const metrics = [
    { label: 'Managed properties', value: displayCount(counts?.managedProperties), detail: 'Across your portfolio', icon: Layers3 },
    { label: 'Active listings', value: displayCount(counts?.activeListings), detail: counts ? `₱ ${(counts.activeTotalValue / 1_000_000).toFixed(1)}M total value` : 'Total value unavailable', icon: House },
    { label: 'Pending review', value: displayCount(counts?.pendingReview), detail: 'Awaiting admin review', icon: Clock3 },
    { label: 'Needs attention', value: displayCount(counts?.needsAttention), detail: 'Update and resubmit', icon: CircleAlert },
  ];
  return (
    <main className="agent-dashboard">
      <div className="agent-page-heading">
        <div>
          <h1>Dashboard</h1>
          <p>An overview of your property listings and buyer inquiries.</p>
        </div>
        <Button className="agent-button agent-button--primary" size="medium" onClick={() => navigate('/agent/add-listings')}>
          + Add listing
        </Button>
      </div>

      {error && <p className="agent-empty-state" role="alert">{error} <button type="button" onClick={() => { setError(''); setRefresh((value) => value + 1); }}>Retry</button></p>}

      <section className="agent-profile-card" aria-label="Agent profile summary">
        <img src="/assets/figma/avatar.svg" alt="" />
        <div className="agent-profile-card__identity">
          <h2>{dashboard?.profile.name ?? (error ? 'Profile unavailable' : 'Loading profile…')}</h2>
          {dashboard && <p>{dashboard.profile.credential}{dashboard.profile.city && <> <span>·</span> {dashboard.profile.city}</>}</p>}
        </div>
        {dashboard?.profile.verified && <span className="agent-profile-card__verified">Verified agent</span>}
      </section>

      <section className="agent-metrics" aria-label="Listing metrics">
        {metrics.map((metric) => <AgentMetricCard key={metric.label} {...metric} />)}
      </section>

      <div className="agent-dashboard-grid">
        <section className="agent-panel agent-dashboard-listings">
          <div className="agent-panel__heading">
            <div>
              <h2>Listing activity</h2>
              <p>Recent updates across your properties</p>
            </div>
            <button type="button" className="agent-text-action" onClick={() => navigate('/agent/activity')}>
              View all <ArrowRight size={16} />
            </button>
          </div>
          <div className="agent-dashboard-listings__items">
            {dashboard?.recentListings.map((listing) => (
              <AgentListingCard key={listing.id} listing={asCardListing(listing)} onAction={() => navigate(`/agent/my-listings/${listing.id}`)} />
            ))}
            {!dashboard && !error && <p className="agent-empty-state" role="status">Loading listings…</p>}
            {dashboard && !dashboard.recentListings.length && <p className="agent-empty-state">No listings yet. Add your first property to get started.</p>}
          </div>
        </section>

        <section className="agent-panel agent-inquiries">
          <div className="agent-panel__heading">
            <div>
              <h2>Recent buyer inquiries</h2>
              <p>Follow up with interested buyers</p>
            </div>
            <button type="button" className="agent-text-action" onClick={() => navigate('/agent/inquiries')}>
              View all <ArrowRight size={16} />
            </button>
          </div>
          <p className="agent-empty-state">No buyer inquiries yet.</p>
        </section>
      </div>
    </main>
  );
}
