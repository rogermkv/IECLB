import { CheckCircle2, Heart, HeartHandshake } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getDeviceToken } from '../services/api.js';

function PrayerCard({ request }) {
  const deviceToken = useMemo(() => getDeviceToken(), []);
  const [hasPrayed, setHasPrayed] = useState(false);
  const [count, setCount] = useState(request.prayer_count || 0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api('/prayer-requests/' + request.id + '/pray-status?device_token=' + encodeURIComponent(deviceToken))
      .then((data) => {
        setHasPrayed(data.has_prayed);
        setCount(data.prayer_count);
      })
      .catch(() => {});
  }, [request.id, deviceToken]);

  async function markPrayer() {
    try {
      const data = await api('/prayer-requests/' + request.id + '/pray', {
        method: 'POST',
        body: JSON.stringify({ device_token: deviceToken })
      });
      setHasPrayed(true);
      setCount(data.prayer_count);
      setMessage('Obrigado por dedicar um momento de oração.\n\nDeus abençoe sua caminhada.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <article className="prayer-public-card">
      <h2>🙏 {request.name ? 'Por ' + request.name : 'Pedido de oração'}</h2>
      <p>{request.request_text}</p>
      <div className="prayer-count"><Heart size={22} aria-hidden="true" /> {count} membros da comunidade estão orando por este pedido.</div>
      <button className={hasPrayed ? 'prayer-mark-button marked' : 'prayer-mark-button'} type="button" onClick={markPrayer} disabled={hasPrayed}>
        {hasPrayed ? <CheckCircle2 size={24} aria-hidden="true" /> : <HeartHandshake size={24} aria-hidden="true" />}
        {hasPrayed ? 'Você marcou que está orando.' : 'Estou orando'}
      </button>
      {message && <p className="prayer-thanks">{message}</p>}
    </article>
  );
}

export default function PrayerRequestsPublic() {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('Carregando pedidos de oração...');

  useEffect(() => {
    api('/prayer-requests/public')
      .then((data) => {
        setRequests(data);
        setMessage('');
      })
      .catch((error) => setMessage(error.message));
  }, []);

  return (
    <main className="content-section page-section prayer-page">
      <div className="section-heading prayer-list-heading">
        <div>
          <p className="eyebrow">Pedidos de Oração</p>
          <h1>Pedidos da comunidade</h1>
        </div>
        <Link className="button secondary" to="/oracao/novo">Fazer um pedido</Link>
      </div>
      {message && <p className="status-message">{message}</p>}
      {!message && requests.length === 0 && <p className="empty-announcements">Nenhum pedido público no momento.</p>}
      <div className="prayer-public-list">
        {requests.map((request) => <PrayerCard key={request.id} request={request} />)}
      </div>
    </main>
  );
}
