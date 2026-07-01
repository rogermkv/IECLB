import { BookOpen, CalendarDays, MapPin, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDate, formatTime } from '../services/api.js';
import { AnnouncementCard } from './Announcements.jsx';


const verses = [
  { text: 'O Senhor Ã© o meu pastor; nada me faltarÃ¡.', reference: 'Salmos 23.1' },
  { text: 'Entrega o teu caminho ao Senhor; confia nele, e ele tudo farÃ¡.', reference: 'Salmos 37.5' },
  { text: 'Deus Ã© o nosso refÃºgio e fortaleza, socorro bem presente nas tribulaÃ§Ãµes.', reference: 'Salmos 46.1' },
  { text: 'LÃ¢mpada para os meus pÃ©s Ã© a tua palavra e luz para o meu caminho.', reference: 'Salmos 119.105' },
  { text: 'Este Ã© o dia que o Senhor fez; regozijemo-nos e alegremo-nos nele.', reference: 'Salmos 118.24' },
  { text: 'O choro pode durar uma noite, mas a alegria vem pela manhÃ£.', reference: 'Salmos 30.5' },
  { text: 'Aquietai-vos e sabei que eu sou Deus.', reference: 'Salmos 46.10' },
  { text: 'O Senhor te guardarÃ¡ de todo mal; guardarÃ¡ a tua alma.', reference: 'Salmos 121.7' },
  { text: 'Confia no Senhor de todo o teu coraÃ§Ã£o e nÃ£o te estribes no teu prÃ³prio entendimento.', reference: 'ProvÃ©rbios 3.5' },
  { text: 'Sobre tudo o que se deve guardar, guarda o teu coraÃ§Ã£o.', reference: 'ProvÃ©rbios 4.23' },
  { text: 'O coraÃ§Ã£o alegre Ã© bom remÃ©dio.', reference: 'ProvÃ©rbios 17.22' },
  { text: 'NÃ£o temas, porque eu sou contigo; nÃ£o te assombres, porque eu sou o teu Deus.', reference: 'IsaÃ­as 41.10' },
  { text: 'Os que esperam no Senhor renovam as suas forÃ§as.', reference: 'IsaÃ­as 40.31' },
  { text: 'Eu Ã© que sei que pensamentos tenho a vosso respeito, pensamentos de paz.', reference: 'Jeremias 29.11' },
  { text: 'As misericÃ³rdias do Senhor sÃ£o a causa de nÃ£o sermos consumidos.', reference: 'LamentaÃ§Ãµes 3.22' },
  { text: 'Buscai, pois, em primeiro lugar, o Reino de Deus e a sua justiÃ§a.', reference: 'Mateus 6.33' },
  { text: 'Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.', reference: 'Mateus 11.28' },
  { text: 'Porque para Deus nÃ£o haverÃ¡ impossÃ­veis em todas as suas promessas.', reference: 'Lucas 1.37' },
  { text: 'Eu sou o caminho, e a verdade, e a vida.', reference: 'JoÃ£o 14.6' },
  { text: 'Deixo-vos a paz, a minha paz vos dou.', reference: 'JoÃ£o 14.27' },
  { text: 'Porque Deus amou ao mundo de tal maneira que deu o seu Filho unigÃªnito.', reference: 'JoÃ£o 3.16' },
  { text: 'Tudo posso naquele que me fortalece.', reference: 'Filipenses 4.13' },
  { text: 'Alegrai-vos sempre no Senhor; outra vez digo: alegrai-vos.', reference: 'Filipenses 4.4' },
  { text: 'O meu Deus suprirÃ¡ todas as necessidades de vocÃªs.', reference: 'Filipenses 4.19' },
  { text: 'LanÃ§ando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vÃ³s.', reference: '1 Pedro 5.7' },
  { text: 'Se Deus Ã© por nÃ³s, quem serÃ¡ contra nÃ³s?', reference: 'Romanos 8.31' },
  { text: 'Todas as coisas cooperam para o bem daqueles que amam a Deus.', reference: 'Romanos 8.28' },
  { text: 'Agora, pois, permanecem a fÃ©, a esperanÃ§a e o amor.', reference: '1 CorÃ­ntios 13.13' },
  { text: 'Sede fortes e corajosos; nÃ£o temais, nem vos atemorizeis.', reference: 'DeuteronÃ´mio 31.6' },
  { text: 'Eu e a minha casa serviremos ao Senhor.', reference: 'JosuÃ© 24.15' }
];

function randomVerseIndex(previousIndex = -1) {
  if (verses.length <= 1) return 0;
  let nextIndex = Math.floor(Math.random() * verses.length);
  while (nextIndex === previousIndex) {
    nextIndex = Math.floor(Math.random() * verses.length);
  }
  return nextIndex;
}

const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });

function dateParts(date) {
  const [year, month, day] = date.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  return {
    weekday: weekdayFormatter.format(localDate).replace('.', '').toUpperCase(),
    day: String(day).padStart(2, '0'),
    month: monthFormatter.format(localDate).replace('.', '').toUpperCase(),
    label: formatDate(date)
  };
}

function nextFiveEventDays(events) {
  const today = new Date().toISOString().slice(0, 10);
  const grouped = new Map();

  events
    .filter((event) => event.date >= today)
    .sort((a, b) => (a.date + ' ' + (a.start_time || '99')).localeCompare(b.date + ' ' + (b.start_time || '99')))
    .forEach((event) => {
      if (!grouped.has(event.date)) grouped.set(event.date, []);
      grouped.get(event.date).push(event);
    });

  return Array.from(grouped.entries()).slice(0, 5).map(([date, dayEvents]) => ({ date, events: dayEvents }));
}

function EventDayCard({ group, index }) {
  const parts = dateParts(group.date);
  const toneClass = ['tone-red', 'tone-green', 'tone-purple', 'tone-gold', 'tone-bright'][index % 5];

  return (
    <article className="day-card">
      <div className={'date-badge ' + toneClass} aria-label={parts.label}>
        <span>{parts.weekday}</span>
        <strong>{parts.day}</strong>
        <small>{parts.month}</small>
      </div>
      <div className="day-events">
        {group.events.map((event) => (
          <Link className="day-event" to={'/eventos/' + event.id} key={event.id}>
            <time>{formatTime(event.start_time) || 'A confirmar'}</time>
            <div>
              <strong>{event.title}</strong>
              <span>{event.category || 'Evento'}</span>
              {event.location && <em><MapPin size={18} aria-hidden="true" />{event.location}</em>}
            </div>
          </Link>
        ))}
      </div>
    </article>
  );
}

export default function Home() {
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [message, setMessage] = useState('Carregando eventos...');
  const [announcementsMessage, setAnnouncementsMessage] = useState('Carregando avisos...');
  const [verseIndex, setVerseIndex] = useState(() => randomVerseIndex());

  useEffect(() => {
    api('/events')
      .then((data) => {
        setEvents(data);
        setMessage('');
      })
      .catch((error) => setMessage(error.message));

    api('/announcements')
      .then((data) => {
        setAnnouncements(data);
        setAnnouncementsMessage('');
      })
      .catch((error) => setAnnouncementsMessage(error.message));
  }, []);

  const fiveDays = useMemo(() => nextFiveEventDays(events), [events]);
  const currentVerse = verses[verseIndex];

  function showAnotherVerse() {
    setVerseIndex((current) => randomVerseIndex(current));
  }

  return (
    <main className="home-app-shell">
      <section className="daily-word-card" aria-label="Palavra do Dia">
        <div className="daily-word-heading">
          <span><BookOpen size={32} aria-hidden="true" /></span>
          <div>
            <p>Palavra do Dia</p>
            <h2>Um versÃ­culo para hoje</h2>
          </div>
        </div>
        <blockquote>
          <p>â€œ{currentVerse.text}â€</p>
          <cite>{currentVerse.reference}</cite>
        </blockquote>
        <button className="verse-button" type="button" onClick={showAnotherVerse}>
          <RefreshCw size={24} aria-hidden="true" />
          Outro versÃ­culo
        </button>
      </section>


      <section className="home-announcements-section" aria-label="Avisos da Comunidade">
        <div className="next-days-heading compact-announcements-heading">
          <div>
            <p className="section-kicker">Avisos da Comunidade</p>
            <h2>Comunicados importantes</h2>
          </div>
          <Link to="/avisos">Ver todos</Link>
        </div>
        {announcementsMessage && <p className="empty-announcements">{announcementsMessage}</p>}
        {!announcementsMessage && announcements.length === 0 && <p className="empty-announcements">Nenhum aviso no momento.</p>}
        <div className="announcements-list">
          {announcements.slice(0, 3).map((announcement) => <AnnouncementCard key={announcement.id} announcement={announcement} />)}
        </div>
      </section>

      <section className="prayer-home-card" aria-label="Pedidos de OraÃ§Ã£o">
        <div>
          <p className="section-kicker">ðŸ™ Pedidos de OraÃ§Ã£o</p>
          <h2>Compartilhe um pedido ou acompanhe os pedidos da comunidade.</h2>
        </div>
        <div className="prayer-home-actions">
          <Link className="prayer-primary-button" to="/oracao/novo">Fazer um pedido</Link>
          <Link className="prayer-outline-button" to="/oracao">Ver pedidos</Link>
        </div>
      </section>

      <section className="next-days-section" id="proximos-dias" aria-label="PrÃ³ximos 5 dias">
        <div className="next-days-heading">
          <div>
            <p className="section-kicker"><CalendarDays size={24} aria-hidden="true" /> PrÃ³ximos 5 dias</p>
            <h2>Atividades da comunidade</h2>
          </div>
          <Link to="/agenda">Ver todos</Link>
        </div>

        {message && <p className="status-message home-status">{message}</p>}
        {!message && fiveDays.length === 0 && <p className="status-message home-status">Nenhum evento encontrado nos prÃ³ximos dias.</p>}
        <div className="next-days-list">
          {fiveDays.map((group, index) => <EventDayCard key={group.date} group={group} index={index} />)}
        </div>
      </section>
    </main>
  );
}

