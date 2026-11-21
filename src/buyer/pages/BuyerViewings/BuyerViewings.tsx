import './BuyerViewings.css';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, CalendarPlus, Check, Clock3, MessageSquare, Plus, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import Button from '../../../components/button.js';
import { buyerListings } from '../../data/listings.js';

type ViewingStatus = 'pending' | 'confirmed' | 'declined' | 'past';
type ViewingTab = 'requests' | 'confirmed' | 'past';
type Viewing = {
  id: string;
  listingId: string;
  date: string;
  time: string;
  status: ViewingStatus;
  agent: string;
  note?: string;
  suggestedDate?: string;
  suggestedTime?: string;
};

const dateOffset = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const initialViewings: Viewing[] = [
  { id: 'viewing-confirmed-1', listingId: 'concepcion-home', date: dateOffset(3), time: '3:00 PM', status: 'confirmed', agent: 'KA', note: 'The agent confirmed your request.' },
  { id: 'viewing-alternate-1', listingId: 'pacol-family', date: dateOffset(4), time: '2:00 PM', status: 'declined', agent: 'JJ', note: 'That time is unavailable. The agent suggested another time.', suggestedDate: dateOffset(5), suggestedTime: '10:00 AM' },
  { id: 'viewing-pending-1', listingId: 'triangulo-condo', date: dateOffset(7), time: '10:00 AM', status: 'pending', agent: 'BF', note: 'I can come any time after 10:00 AM.' },
  { id: 'viewing-past-1', listingId: 'dayangdang-duplex', date: dateOffset(-7), time: '11:00 AM', status: 'past', agent: 'XH', note: 'Viewing completed.' },
];

const tabs: { id: ViewingTab; label: string }[] = [
  { id: 'requests', label: 'Requests' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'past', label: 'Past' },
];

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatPrice(value: number) {
  return `₱${value.toLocaleString('en-PH')}`;
}

export default function BuyerViewings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestProperty = searchParams.get('property');
  const requestFlag = searchParams.get('request');
  const [viewings, setViewings] = useState(initialViewings);
  const [activeTab, setActiveTab] = useState<ViewingTab>('requests');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingViewingId, setEditingViewingId] = useState<string | null>(null);
  const [listingId, setListingId] = useState(buyerListings[0]?.id ?? '');
  const [date, setDate] = useState(dateOffset(2));
  const [time, setTime] = useState('10:00 AM');
  const [note, setNote] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (requestFlag !== '1' || !requestProperty || !buyerListings.some((listing) => listing.id === requestProperty)) return;
    setListingId(requestProperty);
    setDate(dateOffset(2));
    setTime('10:00 AM');
    setNote('');
    setEditingViewingId(null);
    setIsDialogOpen(true);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('property');
      next.delete('request');
      return next;
    }, { replace: true });
  }, [requestFlag, requestProperty, setSearchParams]);

  const visibleViewings = useMemo(() => {
    if (activeTab === 'confirmed') return viewings.filter((viewing) => viewing.status === 'confirmed');
    if (activeTab === 'past') return viewings.filter((viewing) => viewing.status === 'past');
    return viewings.filter((viewing) => viewing.status === 'pending' || viewing.status === 'declined');
  }, [activeTab, viewings]);

  const openRequestDialog = (viewing?: Viewing) => {
    setNotice('');
    setEditingViewingId(viewing?.id ?? null);
    setListingId(viewing?.listingId ?? buyerListings[0]?.id ?? '');
    setDate(viewing?.suggestedDate ?? dateOffset(2));
    setTime(viewing?.suggestedTime ?? '10:00 AM');
    setNote('');
    setIsDialogOpen(true);
  };

  const submitRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const previous = editingViewingId ? viewings.find((viewing) => viewing.id === editingViewingId) : undefined;
    const next: Viewing = {
      id: previous?.id ?? `viewing-${Date.now()}`,
      listingId,
      date,
      time,
      status: 'pending',
      agent: previous?.agent ?? 'KA',
      note: note.trim() || undefined,
    };
    setViewings((current) => previous
      ? current.map((viewing) => viewing.id === previous.id ? next : viewing)
      : [next, ...current]);
    setActiveTab('requests');
    setIsDialogOpen(false);
    setNotice(previous ? 'Your new time request has been sent.' : 'Your viewing request has been sent. It is not confirmed until the agent responds.');
  };

  const acceptSuggestedTime = (viewingId: string) => {
    setViewings((current) => current.map((viewing) => viewing.id === viewingId && viewing.suggestedDate && viewing.suggestedTime
      ? { ...viewing, date: viewing.suggestedDate, time: viewing.suggestedTime, status: 'confirmed', note: 'You accepted the agent’s suggested time.' }
      : viewing));
    setActiveTab('confirmed');
    setNotice('The suggested viewing time is confirmed in this preview.');
  };

  const cancelViewing = (viewingId: string) => {
    setViewings((current) => current.filter((viewing) => viewing.id !== viewingId));
    setNotice('Viewing request canceled in this preview.');
  };

  const getListing = (id: string) => buyerListings.find((listing) => listing.id === id);

  return (
    <section className="buyer-viewings" aria-labelledby="buyer-viewings-title">
      <div className="buyer-page-heading">
        <div>
          <p className="buyer-eyebrow">Buyer workspace</p>
          <h1 id="buyer-viewings-title">Viewings</h1>
          <p className="buyer-viewings__subtitle">Keep track of your property visits and agent responses.</p>
        </div>
        <Button className="buyer-viewings__request-button" onClick={() => openRequestDialog()}>
          <Plus size={17} aria-hidden="true" /> Request a viewing
        </Button>
      </div>

      <div className="buyer-viewings__content">
        <div className="buyer-viewings__toolbar">
          <div className="buyer-viewings__tabs" role="tablist" aria-label="Viewing status">
            {tabs.map((tab) => {
              const count = tab.id === 'requests'
                ? viewings.filter((viewing) => viewing.status === 'pending' || viewing.status === 'declined').length
                : viewings.filter((viewing) => viewing.status === tab.id).length;
              return (
                <button
                  key={tab.id}
                  className={`buyer-viewings__tab${activeTab === tab.id ? ' is-active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}<span>{count}</span>
                </button>
              );
            })}
          </div>
          <p className="buyer-viewings__helper">A request stays pending until the agent responds.</p>
        </div>

        {notice && <p className="buyer-viewings__notice" role="status">{notice}</p>}

        {visibleViewings.length ? (
          <div className="buyer-viewings__list">
            {visibleViewings.map((viewing) => {
              const listing = getListing(viewing.listingId);
              if (!listing) return null;
              return (
                <article className="buyer-viewing-card" key={viewing.id}>
                  <div className="buyer-viewing-card__photo" aria-hidden="true">Property photo</div>
                  <div className="buyer-viewing-card__main">
                    <div className="buyer-viewing-card__heading">
                      <div>
                        <h2>{listing.title}</h2>
                        <p>{listing.location} · {formatPrice(listing.price)}</p>
                      </div>
                      <span className={`buyer-viewing-card__status buyer-viewing-card__status--${viewing.status}`}>
                        {viewing.status === 'declined' ? 'New time offered' : viewing.status === 'past' ? 'Past' : viewing.status}
                      </span>
                    </div>

                    <div className="buyer-viewing-card__date">
                      <CalendarDays size={18} aria-hidden="true" />
                      <strong>{formatDate(viewing.date)} · {viewing.time}</strong>
                    </div>
                    <p className="buyer-viewing-card__response">
                      {viewing.status === 'confirmed' ? `Agent ${viewing.agent} confirmed your request.` : viewing.status === 'declined' ? `Agent ${viewing.agent} suggested ${formatDate(viewing.suggestedDate ?? viewing.date)} · ${viewing.suggestedTime ?? viewing.time}.` : viewing.status === 'past' ? 'This viewing has passed.' : 'Waiting for the agent to respond.'}
                    </p>
                    {viewing.note && viewing.status === 'pending' && <p className="buyer-viewing-card__note">Your note: {viewing.note}</p>}

                    <div className="buyer-viewing-card__actions">
                      {viewing.status === 'declined' && viewing.suggestedDate && viewing.suggestedTime && (
                        <>
                          <Button className="buyer-viewings__primary-action" size="small" onClick={() => acceptSuggestedTime(viewing.id)}>
                            <Check size={16} aria-hidden="true" /> Accept new time
                          </Button>
                          <Button className="buyer-viewings__secondary-action" size="small" variant="secondary" onClick={() => openRequestDialog(viewing)}>
                            Pick another time
                          </Button>
                        </>
                      )}
                      {(viewing.status === 'pending' || viewing.status === 'confirmed') && (
                        <>
                          <Button className="buyer-viewings__secondary-action" size="small" variant="secondary" onClick={() => navigate('/buyer/messages')}>
                            <MessageSquare size={16} aria-hidden="true" /> Message agent
                          </Button>
                          <button className="buyer-viewings__text-action" type="button" onClick={() => cancelViewing(viewing.id)}>
                            Cancel
                          </button>
                        </>
                      )}
                      {viewing.status === 'past' && (
                        <Button className="buyer-viewings__secondary-action" size="small" variant="secondary" onClick={() => navigate(`/buyer/properties?q=${encodeURIComponent(listing.location)}`)}>
                          View property
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="buyer-viewings__empty">
            <span className="buyer-viewings__empty-icon"><CalendarPlus size={25} aria-hidden="true" /></span>
            <h2>{activeTab === 'past' ? 'No past viewings' : activeTab === 'confirmed' ? 'No confirmed viewings yet' : 'No viewing requests yet'}</h2>
            <p>{activeTab === 'requests' ? 'Choose a home and request a time that works for you.' : 'Your viewings will appear here when there is an update.'}</p>
            {activeTab === 'requests' && <Button className="buyer-viewings__primary-action" onClick={() => openRequestDialog()}>Request a viewing</Button>}
          </div>
        )}
      </div>

      {isDialogOpen && (
        <div className="buyer-viewings__backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsDialogOpen(false);
        }}>
          <section className="buyer-viewings__dialog" role="dialog" aria-modal="true" aria-labelledby="buyer-viewings-dialog-title">
            <div className="buyer-viewings__dialog-heading">
              <div>
                <span className="buyer-viewings__dialog-icon"><CalendarPlus size={19} aria-hidden="true" /></span>
                <h2 id="buyer-viewings-dialog-title">{editingViewingId ? 'Pick another time' : 'Request a viewing'}</h2>
                <p>The agent will confirm or reply with another time.</p>
              </div>
              <button className="buyer-viewings__dialog-close" type="button" aria-label="Close request form" onClick={() => setIsDialogOpen(false)}><X size={19} /></button>
            </div>
            <form className="buyer-viewings__form" onSubmit={submitRequest}>
              <label>
                <span>Property</span>
                <select value={listingId} required onChange={(event) => setListingId(event.target.value)}>
                  {buyerListings.map((listing) => <option key={listing.id} value={listing.id}>{listing.title} · {listing.location}</option>)}
                </select>
              </label>
              <div className="buyer-viewings__form-row">
                <label><span>Pick a day</span><input type="date" value={date} min={dateOffset(0)} required onChange={(event) => setDate(event.target.value)} /></label>
                <label><span>Pick a time</span><select value={time} onChange={(event) => setTime(event.target.value)}><option>10:00 AM</option><option>2:00 PM</option><option>4:00 PM</option></select></label>
              </div>
              <label><span>Note to agent <small>(optional)</small></span><textarea value={note} maxLength={500} rows={3} placeholder="Add a note for the agent" onChange={(event) => setNote(event.target.value)} /></label>
              <p className="buyer-viewings__pending-note"><Clock3 size={16} aria-hidden="true" /> This request is not confirmed until the agent accepts.</p>
              <div className="buyer-viewings__dialog-actions">
                <Button className="buyer-viewings__secondary-action" type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button className="buyer-viewings__primary-action" type="submit">Send request</Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
