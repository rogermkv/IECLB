import { AlertTriangle, CalendarDays, Megaphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, formatDate } from '../services/api.js';

function announcementClass(type) {
  if (type === 'Urgente') return 'announcement-card urgent';
  if (type === 'Importante') return 'announcement-card important';
  return 'announcement-card normal';
}

function dateLabel(date) {
  return date ? formatDate(date) : '';
}

export function AnnouncementCard({ announcement }) {
  return (
    <article className={announcementClass(announcement.type)}>
      <div className="announcement-topline">
        <span><Megaphone size={22} aria-hidden="true" />{announcement.type || 'Normal'}</span>
        {announcement.type === 'Urgente' && <strong><AlertTriangle size={22} aria-hidden="true" />Urgente</strong>}
      </div>
      <h3>{announcement.title}</h3>
      <p>{announcement.message}</p>
      <div className="announcement-dates">
        <span><CalendarDays size={20} aria-hidden="true" />Publicado em {dateLabel((announcement.created_at || '').slice(0, 10))}</span>
        {announcement.end_date && <span>Exibir até {dateLabel(announcement.end_date)}</span>}
      </div>
    </article>
  );
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [message, setMessage] = useState('Carregando avisos...');

  useEffect(() => {
    api('/announcements')
      .then((data) => {
        setAnnouncements(data);
        setMessage('');
      })
      .catch((error) => setMessage(error.message));
  }, []);

  return (
    <main className="content-section page-section announcements-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Comunicados importantes</p>
          <h1>Avisos da Comunidade</h1>
        </div>
      </div>
      {message && <p className="status-message">{message}</p>}
      {!message && announcements.length === 0 && <p className="empty-announcements">Nenhum aviso no momento.</p>}
      <div className="announcements-list full">
        {announcements.map((announcement) => <AnnouncementCard key={announcement.id} announcement={announcement} />)}
      </div>
    </main>
  );
}
