import { useEffect, useState } from 'react';
import type { Property, ViewingRequest } from '../types.js';
import { formatPeso, getProperty } from '../utils.js';
import Icon from '../shared/Icon.js';
import StateMessage from '../shared/StateMessage.js';
import { getBuyerAppointments, type BuyerAppointment } from '../buyerApi.js';
import { getPublicListings } from '../../shared/maps/listingsApi.js';

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' }).format(new Date(value));

export default function Viewings() {
  const [viewingRequests, setViewingRequests] = useState<BuyerAppointment[]>([]); const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([getBuyerAppointments(), getPublicListings()]).then(([appointments, listings]) => {
      setViewingRequests(appointments);
      setProperties(listings.map((item) => ({ id: item.id, title: item.title, area: item.location, type: item.propertyType as Property['type'], price: Number(item.price), bedrooms: item.bedrooms ?? 0, bathrooms: item.bathrooms ?? 0, floorArea: item.floorArea ?? 0, pinX: 50, pinY: 50 })));
    }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, []);

  return <main className="discovery-page viewings-page">
    <h1 className="discovery-title">Viewing Requests</h1>
    {loading ? <StateMessage title="Loading viewing requests…" text="Your appointments are loading." kind="loading" /> : error ? <p className="auth-login__error" role="alert">{error}</p> : viewingRequests.length === 0 ? <StateMessage title="No viewing requests yet." text="Choose an available time from a property to request a viewing." /> : <ul className="viewing-list">
      {viewingRequests.map((request: BuyerAppointment) => {
        const property = getProperty(properties, request.listingId);
        const statusText: ViewingRequest['status'] = request.status === 'confirmed' ? 'Confirmed' : request.status === 'declined' ? 'Declined' : 'Not confirmed';
        const confirmed = request.status === 'confirmed';
        return <li key={request.id} className="viewing-card"><div className="viewing-card__top"><span className={`viewing-card__heading${confirmed ? ' is-large' : ''}`}>{formatDate(request.startsAt)}</span><span className={`viewing-status viewing-status--${request.status}`}>{statusText}</span></div>
          <p className="viewing-card__property">{request.listingTitle}{property ? ` · ${property.area}` : ''} · Agent {request.agentName}</p>{property && <p className="viewing-card__price">{formatPeso(property.price)}</p>}
          <p className="viewing-card__line"><Icon name="calendar" size={18} /> Ends {new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(new Date(request.endsAt))}</p>
          <p className="viewing-card__line"><Icon name="chat" size={18} /> {request.buyerNote ? `Your note: ${request.buyerNote}` : 'No note added'}</p>
          {request.agentNote && <p className="viewing-card__line"><Icon name="info" size={18} /> Agent note: {request.agentNote}</p>}
          <p className={`viewing-card__banner${confirmed ? ' is-confirmed' : ''}`}><Icon name={confirmed ? 'check' : 'info'} size={18} /><span>{confirmed ? 'Agent accepted your request. This viewing is confirmed.' : request.status === 'declined' ? 'The agent declined this requested time. Choose another available slot.' : 'Not confirmed until the agent accepts your request.'}</span></p>
        </li>;
      })}
    </ul>}
  </main>;
}
