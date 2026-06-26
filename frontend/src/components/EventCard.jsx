import { CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { eventTime, formatDate } from '../services/api.js';
import RsvpBox from './RsvpBox.jsx';

export default function EventCard({ event, highlight = false }) {
  return (
    <article className={highlight ? 'event-card highlight' : 'event-card'}>
      <div className="event-date">
        <CalendarDays size={20} aria-hidden="true" />
        <span>{formatDate(event.date)}</span>
      </div>
      <h3>{event.title}</h3>
      <div className="event-meta">
        <span><Clock size={18} aria-hidden="true" />{eventTime(event)}</span>
        {event.location && <span><MapPin size={18} aria-hidden="true" />{event.location}</span>}
        {event.audience && <span><Users size={18} aria-hidden="true" />{event.audience}</span>}
      </div>
      {event.category && <p className="pill">{event.category}</p>}
      {event.description && <p className="event-summary">{event.description}</p>}
      <RsvpBox event={event} compact />
      <Link className="button secondary" to={'/eventos/' + event.id}>Ver detalhes</Link>
    </article>
  );
}
