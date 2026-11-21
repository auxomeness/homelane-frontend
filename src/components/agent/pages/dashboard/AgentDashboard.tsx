import { ArrowRight, CircleAlert, Clock3, House, Layers3 } from 'lucide-react';
import { useNavigate } from 'react-router';
import Button from '../../../button.js';
import AgentMetricCard from '../../dashboard/AgentMetricCard.js';
import { useAgentData } from '../../libs/AgentDataContext.js';
import './dashboardStyles.css';

export default function AgentDashboard() {
  const navigate = useNavigate();
  const { listings, inquiries, profile, dashboard, activity, loading, error, reload } = useAgentData();
  const activeListings = listings.filter((listing) => listing.status === 'active');
  const totalValue = activeListings.reduce((sum, listing) => sum + Number(listing.price.replace(/[^\d]/g, '')), 0);
  const metrics = [
    { label: 'Managed properties', value: String(dashboard?.listings.total ?? listings.length), detail: 'Across your portfolio', icon: Layers3 },
    { label: 'Active listings', value: String(dashboard?.listings.byStatus.active ?? activeListings.length), detail: `₱ ${(totalValue / 1_000_000).toFixed(1)}M total value`, icon: House },
    { label: 'Pending review', value: String(dashboard?.listings.byStatus.pending ?? listings.filter((listing) => listing.status === 'pending').length), detail: 'Awaiting admin review', icon: Clock3 },
    { label: 'Needs attention', value: String(dashboard?.listings.byStatus.rejected ?? listings.filter((listing) => listing.status === 'rejected').length), detail: 'Update and resubmit', icon: CircleAlert },
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

      {error && <div className="agent-workspace-error" role="alert">{error}<button type="button" onClick={() => void reload()}>Retry</button></div>}

      <section className="agent-profile-card" aria-label="Agent profile summary">
        <img src="/assets/figma/avatar.svg" alt="" />
        <div className="agent-profile-card__identity">
          <h2>{profile.name || 'Your agent workspace'}</h2>
          <p>{[profile.credential, profile.city].filter(Boolean).join(' · ') || 'Complete your profile to help buyers get to know you.'}</p>
        </div>
        {profile.verified && <span className="agent-profile-card__verified">Verified agent</span>}
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
            {activity.slice(0, 4).map((event) => <button type="button" className="agent-dashboard-activity" key={event.id} onClick={() => event.entityType === 'listing' && navigate(`/agent/my-listings/${event.entityId}`)}><span><strong>{event.summary}</strong><small>{new Date(event.createdAt).toLocaleString()}</small></span><ArrowRight size={16} /></button>)}
            {loading && !activity.length && <p className="agent-empty-state">Loading activity…</p>}
            {!loading && !activity.length && <p className="agent-empty-state">No activity yet. Add a listing or reply to a buyer to get started.</p>}
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
          {inquiries.slice(0, 3).map((inquiry) => <button type="button" className="agent-inquiry agent-inquiry--button" key={inquiry.id} onClick={() => navigate(`/agent/messages?inquiry=${inquiry.id}`)}>
            <div className="agent-inquiry__avatar">{inquiry.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
            <div><h3>{inquiry.name}</h3><p>{inquiry.property} · “{inquiry.message}”</p></div>
            {inquiry.status === 'new' && <span className="agent-inquiry__new">New</span>}
          </button>)}
          {!inquiries.length && <p className="agent-empty-state">No buyer inquiries yet.</p>}
        </section>
      </div>
    </main>
  );
}
