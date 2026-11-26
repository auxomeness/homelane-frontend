import { useEffect, useState } from 'react';
import type { NotificationCategory, NotificationItem, OfferSummary, Property } from '../types.js';
import { formatPeso, getProperty, notificationCategories } from '../utils.js';
import Icon, { type IconName } from '../shared/Icon.js';
import StateMessage from '../shared/StateMessage.js';
import useDiscoveryNavigate from '../shared/useDiscoveryNavigate.js';
import { getBuyerNotifications, getBuyerOffers, markAllBuyerNotificationsRead, markBuyerNotificationRead, type AccountNotification, type BuyerOffer } from '../buyerApi.js';
import { getPublicListings } from '../../shared/maps/listingsApi.js';

const categoryIcon: Record<NotificationCategory, IconName> = {
  Messages: 'message',
  Offers: 'tag',
  Viewings: 'eye',
  Listings: 'home',
};

const linkLabel: Record<NotificationCategory, string> = {
  Messages: 'Go to Messages',
  Offers: 'View Offer',
  Viewings: 'View Viewings',
  Listings: 'View Listings',
};

const categoryFor = (type: string): NotificationCategory => type.startsWith('offer_') ? 'Offers' : type.startsWith('appointment_') ? 'Viewings' : type.includes('listing') ? 'Listings' : 'Messages';
const linkFor = (category: NotificationCategory): NotificationItem['link'] => category === 'Viewings' ? 'viewings' : category === 'Listings' ? 'map' : 'messages';
const readableTime = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export default function Notifications() {
  const onNavigate = useDiscoveryNavigate();
  const [category, setCategory] = useState<'All' | NotificationCategory>('All');
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [offerSummaries, setOfferSummaries] = useState<OfferSummary[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    Promise.all([getBuyerNotifications(), getBuyerOffers(), getPublicListings()]).then(([notifications, offers, listings]) => {
      setItems(notifications.map((item: AccountNotification) => { const itemCategory = categoryFor(item.eventType); return { id: item.id, category: itemCategory, title: item.title, description: item.body, time: readableTime(item.createdAt), read: Boolean(item.readAt), reference: item.entityId, link: linkFor(itemCategory) }; }));
      setOfferSummaries(offers.map((item: BuyerOffer) => ({ id: item.id, propertyId: item.listingId, agentInitials: item.agentName.split(/\s+/).map((part) => part[0] ?? '').join('').slice(0, 2).toUpperCase(), proposed: Number(item.amount), time: readableTime(item.createdAt), status: item.status === 'accepted' ? 'Accepted' : item.status === 'declined' ? 'Declined' : item.status === 'countered' ? 'Countered' : 'Pending' })));
      setProperties(listings.map((item) => ({ id: item.id, title: item.title, area: item.location, type: item.propertyType as Property['type'], price: Number(item.price), bedrooms: item.bedrooms ?? 0, bathrooms: item.bathrooms ?? 0, floorArea: item.floorArea ?? 0, pinX: 50, pinY: 50 })));
    }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, []);

  const visible = items.filter((item) => category === 'All' || item.category === category);
  const markRead = async (id: string) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    try { await markBuyerNotificationRead(id); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update notification.'); setItems((current) => current.map((item) => item.id === id ? { ...item, read: false } : item)); }
  };
  const followNotification = async (item: NotificationItem) => {
    await markRead(item.id);
    if (item.link) onNavigate(item.link);
  };
  const markAllRead = async () => {
    const previous = items;
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    setMarkingAll(true); setError('');
    try { await markAllBuyerNotificationsRead(); }
    catch (reason) { setItems(previous); setError(reason instanceof Error ? reason.message : 'Unable to update notifications.'); }
    finally { setMarkingAll(false); }
  };

  return (
    <main className="discovery-page notifications-page">
      {loading ? <StateMessage title="Loading notifications…" text="Checking for new activity." kind="loading" /> : null}
      {error && <p className="auth-login__error" role="alert">{error}</p>}
      {!loading && <>
      {items.some((item) => !item.read) && <button type="button" className="notification-mark-all" onClick={() => void markAllRead()} disabled={markingAll}>{markingAll ? 'Marking as read…' : 'Mark all as read'}</button>}
      <div
        className="notification-filter"
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setMenuOpen(false); }}
        onKeyDown={(e) => { if (e.key === 'Escape') setMenuOpen(false); }}
      >
        <button
          type="button"
          className="notification-filter__button"
          aria-haspopup="listbox"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span>{category === 'All' ? 'All notifications' : category}</span>
          <Icon name={menuOpen ? 'chevron-up' : 'chevron-down'} size={24} />
        </button>
        {menuOpen && (
          <ul className="notification-filter__menu" role="listbox" aria-label="Notification category">
            {notificationCategories.map((name) => (
              <li key={name} role="option" aria-selected={category === name}>
                <button
                  type="button"
                  className={category === name ? 'is-selected' : ''}
                  onClick={() => { setCategory(name); setMenuOpen(false); }}
                >
                  <span>{name === 'All' ? 'All notifications' : name}</span>
                  {category === name && <Icon name="tick" size={20} />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {category === 'Offers' && offerSummaries.length === 0 ? (
        <StateMessage title="No offers yet." text="Offers you send or receive will appear here." />
      ) : category === 'Offers' ? (
        <ul className="offer-grid" aria-label="Offers">
          {offerSummaries.map((offer) => (
            <li key={offer.id} className="offer-summary">
              <div className="offer-summary__top">
                <span className="notification__icon is-unread"><Icon name="tag" size={18} /></span>
                <strong>Offer for {getProperty(properties, offer.propertyId)?.title}</strong>
              </div>
              <p className="offer-summary__meta">Agent: {offer.agentInitials}</p>
              <p className="offer-summary__meta">Proposed Offer: {formatPeso(offer.proposed)}</p>
              <div className="offer-summary__bottom">
                <time>{offer.time}</time>
                <button type="button" className="offer-summary__view" onClick={() => onNavigate('messages')}>
                  View <Icon name="arrow-right" size={12} />
                </button>
                <span className={`status-pill status-pill--${offer.status.toLowerCase()}`}>{offer.status}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : visible.length === 0 ? (
        <StateMessage title="You have no notifications." text="New activity will appear here." />
      ) : (
        <ul className="notification-list">
          {visible.map((item) => (
            <li key={item.id} className={`notification${item.read ? '' : ' is-unread'}`}>
              <span className={`notification__icon${item.read ? '' : ' is-unread'}`} aria-label={item.read ? 'Read' : 'Unread'}>
                <Icon name={categoryIcon[item.category]} size={20} />
              </span>
              <div className="notification__body">
                <div className="notification__row">
                  <strong>{item.title}</strong>
                  <time>{item.time}</time>
                </div>
                <p>{item.description}</p>
                <button
                  type="button"
                  className="notification__link"
                  onClick={() => { void followNotification(item); }}
                >
                  {linkLabel[item.category]} <Icon name="arrow-right" size={12} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      </>}
    </main>
  );
}
