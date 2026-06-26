import { ArrowLeft, CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, eventTime, formatDate } from '../services/api.js';
import RsvpBox from '../components/RsvpBox.jsx';

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [message, setMessage] = useState('Carregando evento...');

  useEffect(() => {
    api('/events/' + id)
      .then((data) => { setEvent(data); setMessage(''); })
      .catch((error) => setMessage(error.message));
  }, [id]);

  if (message) return <main className="content-section page-section"><p className="status-message">{message}</p></main>;

  return (
    <main className="content-section page-section narrow">
      <Link className="back-link" to="/agenda"><ArrowLeft size={20} aria-hidden="true" /> Voltar para a agenda</Link>
      <article className="details-panel">
        <p className="pill">{event.category || 'Evento'}</p>
        <h1>{event.title}</h1>
        <div className="detail-list">
          <span><CalendarDays size={22} aria-hidden="true" />{formatDate(event.date)}</span>
          <span><Clock size={22} aria-hidden="true" />{eventTime(event)}</span>
          {event.location && <span><MapPin size={22} aria-hidden="true" />{event.location}</span>}
          {event.audience && <span><Users size={22} aria-hidden="true" />{event.audience}</span>}
        </div>
        <RsvpBox event={event} />
        {event.description && <section><h2>Descrição</h2><p>{event.description}</p></section>}
        {event.notes && <section><h2>Observações</h2><p>{event.notes}</p></section>}
      </article>
    </main>
  );
}
