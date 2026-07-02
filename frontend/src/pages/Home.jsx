import { BookOpen, CalendarDays, MapPin, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatTime } from '../services/api.js';
import { AnnouncementCard } from './Announcements.jsx';

const verses = [
  { text: 'O Senhor é o meu pastor; nada me faltará.', reference: 'Salmos 23.1' },
  { text: 'Tudo posso naquele que me fortalece.', reference: 'Filipenses 4.13' },
  { text: 'Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.', reference: '1 Pedro 5.7' },
  { text: 'O Senhor é a minha luz e a minha salvação; de quem terei medo?', reference: 'Salmos 27.1' },
  { text: 'Alegrai-vos sempre no Senhor; outra vez digo: alegrai-vos.', reference: 'Filipenses 4.4' },
  { text: 'Entrega o teu caminho ao Senhor, confia nele, e o mais ele fará.', reference: 'Salmos 37.5' },
  { text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.', reference: 'João 3.16' },
  { text: 'O Senhor te abençoe e te guarde.', reference: 'Números 6.24' },
  { text: 'Aquietai-vos e sabei que eu sou Deus.', reference: 'Salmos 46.10' },
  { text: 'O meu socorro vem do Senhor, que fez o céu e a terra.', reference: 'Salmos 121.2' },
  { text: 'Buscai primeiro o Reino de Deus e a sua justiça.', reference: 'Mateus 6.33' },
  { text: 'Vinde a mim todos os que estais cansados, e eu vos aliviarei.', reference: 'Mateus 11.28' },
  { text: 'Bem-aventurados os pacificadores, porque serão chamados filhos de Deus.', reference: 'Mateus 5.9' },
  { text: 'O Senhor é bom, é fortaleza no dia da angústia.', reference: 'Naum 1.7' },
  { text: 'Sede fortes e corajosos; não temais, nem vos assusteis.', reference: 'Deuteronômio 31.6' },
  { text: 'A graça do Senhor Jesus seja com todos.', reference: 'Apocalipse 22.21' },
  { text: 'O amor jamais acaba.', reference: '1 Coríntios 13.8' },
  { text: 'Deus é o nosso refúgio e fortaleza, socorro bem presente nas tribulações.', reference: 'Salmos 46.1' },
  { text: 'O choro pode durar uma noite, mas a alegria vem pela manhã.', reference: 'Salmos 30.5' },
  { text: 'Guia-me pelas veredas da justiça por amor do seu nome.', reference: 'Salmos 23.3' },
  { text: 'O fruto do Espírito é amor, alegria, paz, longanimidade, benignidade, bondade, fidelidade.', reference: 'Gálatas 5.22' },
  { text: 'Se Deus é por nós, quem será contra nós?', reference: 'Romanos 8.31' },
  { text: 'A tua palavra é lâmpada para os meus pés e luz para os meus caminhos.', reference: 'Salmos 119.105' },
  { text: 'Bendize, ó minha alma, ao Senhor, e não te esqueças de nem um só de seus benefícios.', reference: 'Salmos 103.2' },
  { text: 'Perto está o Senhor dos que têm o coração quebrantado.', reference: 'Salmos 34.18' },
  { text: 'O Senhor guardará a tua saída e a tua entrada, desde agora e para sempre.', reference: 'Salmos 121.8' },
  { text: 'Amai-vos cordialmente uns aos outros com amor fraternal.', reference: 'Romanos 12.10' },
  { text: 'Servi ao Senhor com alegria.', reference: 'Salmos 100.2' },
  { text: 'Não temas, porque eu sou contigo.', reference: 'Isaías 41.10' },
  { text: 'Graças a Deus pelo seu dom inefável.', reference: '2 Coríntios 9.15' }
];

function weekdayName(date) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date).replace('.', '').toUpperCase();
}

function monthName(date) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', '').toUpperCase();
}

function localDateFromIso(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function todayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayColor(index) {
  const colors = ['tone-red', 'tone-green', 'tone-purple', 'tone-gold', 'tone-bright'];
  return colors[index % colors.length];
}

export default function Home() {
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [message, setMessage] = useState('Carregando agenda...');
  const [announcementMessage, setAnnouncementMessage] = useState('Carregando avisos...');
  const [verseIndex, setVerseIndex] = useState(() => Math.floor(Math.random() * verses.length));

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
        setAnnouncementMessage('');
      })
      .catch((error) => setAnnouncementMessage(error.message));
  }, []);

  const groupedDays = useMemo(() => {
    const start = todayIso();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 4);
    const end = endDate.toISOString().slice(0, 10);
    const upcoming = events
      .filter((event) => event.date >= start && event.date <= end)
      .sort((a, b) => `${a.date} ${a.start_time || ''}`.localeCompare(`${b.date} ${b.start_time || ''}`));

    return upcoming.reduce((acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    }, {});
  }, [events]);

  const nextVerse = () => {
    setVerseIndex((current) => {
      if (verses.length <= 1) return current;
      let next = current;
      while (next === current) next = Math.floor(Math.random() * verses.length);
      return next;
    });
  };

  const currentVerse = verses[verseIndex];
  const dates = Object.keys(groupedDays).sort();

  return (
    <main className="home-app-shell">
      <section className="home-announcements-section" id="avisos">
        <div className="next-days-heading compact-announcements-heading">
          <div>
            <p className="section-kicker">Avisos da Comunidade</p>
            <h2>Comunicados importantes</h2>
          </div>
          <Link to="/avisos">Ver todos</Link>
        </div>
        {announcementMessage && <p className="home-status">{announcementMessage}</p>}
        {!announcementMessage && announcements.length === 0 && <p className="empty-announcements">Nenhum aviso no momento.</p>}
        <div className="announcements-list compact">
          {announcements.slice(0, 3).map((announcement) => <AnnouncementCard key={announcement.id} announcement={announcement} />)}
        </div>
      </section>

      <section className="daily-word-card">
        <div className="daily-word-heading">
          <span><BookOpen size={24} aria-hidden="true" /></span>
          <div>
            <p>Palavra do Dia</p>
            <h2>Um versículo para hoje</h2>
          </div>
        </div>
        <blockquote>
          <p>“{currentVerse.text}”</p>
          <cite>{currentVerse.reference}</cite>
        </blockquote>
        <button type="button" className="verse-button" onClick={nextVerse}>
          <RefreshCw size={18} aria-hidden="true" />
          Outro versículo
        </button>
      </section>

      <section className="prayer-home-card">
        <div>
          <p className="section-kicker">Pedidos de Oração</p>
          <h2>Compartilhe um pedido ou acompanhe os pedidos da comunidade.</h2>
        </div>
        <div className="prayer-home-actions">
          <Link className="prayer-primary-button" to="/oracao/novo">Fazer um pedido</Link>
          <Link className="prayer-outline-button" to="/oracao">Ver pedidos</Link>
        </div>
      </section>

      <section className="next-days-section">
        <div className="next-days-heading">
          <div>
            <p className="section-kicker"><CalendarDays size={18} aria-hidden="true" /> Próximos 5 dias</p>
            <h2>Atividades da comunidade</h2>
          </div>
          <Link to="/agenda">Ver todos</Link>
        </div>

        {message && <p className="home-status">{message}</p>}
        {!message && dates.length === 0 && <p className="home-status">Nenhum evento nos próximos dias.</p>}

        <div className="next-days-list">
          {dates.map((date, index) => {
            const parsedDate = localDateFromIso(date);
            return (
              <article className="day-card" key={date}>
                <div className={`date-badge ${dayColor(index)}`}>
                  <span>{weekdayName(parsedDate)}</span>
                  <strong>{String(parsedDate.getDate()).padStart(2, '0')}</strong>
                  <small>{monthName(parsedDate)}</small>
                </div>
                <div className="day-events">
                  {groupedDays[date].map((event) => (
                    <Link className="day-event" key={event.id} to={`/eventos/${event.id}`}>
                      <time>{formatTime(event.start_time) || 'A confirmar'}</time>
                      <div>
                        <strong>{event.title}</strong>
                        <span>{event.category}</span>
                        {event.location && <em><MapPin size={16} aria-hidden="true" />{event.location}</em>}
                      </div>
                    </Link>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}