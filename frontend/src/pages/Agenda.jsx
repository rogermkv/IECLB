import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import EventCard from '../components/EventCard.jsx';
import Filters from '../components/Filters.jsx';

export default function Agenda() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filters, setFilters] = useState({ month: '', category: '', location: '', search: '' });
  const [message, setMessage] = useState('Carregando agenda...');

  useEffect(() => {
    Promise.all([api('/events'), api('/categories'), api('/locations')])
      .then(([eventsData, categoriesData, locationsData]) => {
        setEvents(eventsData);
        setCategories(categoriesData);
        setLocations(locationsData);
        setMessage('');
      })
      .catch((error) => setMessage(error.message));
  }, []);

  const filtered = useMemo(() => {
    const term = filters.search.toLowerCase().trim();
    return events.filter((event) => {
      const monthOk = !filters.month || event.date.startsWith(filters.month);
      const categoryText = [event.category, event.title, event.location, event.audience, event.description, event.notes].join(' ').toLowerCase();
      const categoryOk = !filters.category || event.category === filters.category || (filters.category === 'OASE' && categoryText.includes('oase'));
      const locationOk = !filters.location || event.location === filters.location;
      const searchText = [event.title, event.category, event.location, event.audience, event.description, event.notes].join(' ').toLowerCase();
      const searchOk = !term || searchText.includes(term);
      return monthOk && categoryOk && locationOk && searchOk;
    });
  }, [events, filters]);

  return (
    <main className="content-section page-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">CalendÃ¡rio da comunidade</p>
          <h1>Agenda completa</h1>
        </div>
      </div>
      <Filters filters={filters} setFilters={setFilters} categories={categories} locations={locations} />
      {message && <p className="status-message">{message}</p>}
      {!message && filtered.length === 0 && <p className="status-message">Nenhum evento encontrado com esses filtros.</p>}
      <div className="event-grid list-grid">
        {filtered.map((event) => <EventCard key={event.id} event={event} />)}
      </div>
    </main>
  );
}

