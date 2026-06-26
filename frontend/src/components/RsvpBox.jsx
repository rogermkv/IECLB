import { CheckCircle2, UserRoundCheck, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api, getDeviceToken } from '../services/api.js';

function normalizedNames(names, quantity) {
  return Array.from({ length: quantity }, (_, index) => names[index] || '');
}

export default function RsvpBox({ event, compact = false }) {
  const enabled = Boolean(event.allow_rsvp);
  const showNames = Boolean(event.show_rsvp_names_public);
  const [summary, setSummary] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [names, setNames] = useState(['']);
  const [message, setMessage] = useState('');
  const deviceToken = useMemo(() => getDeviceToken(), []);

  async function loadSummary() {
    if (!enabled) return;
    const data = await api('/events/' + event.id + '/rsvp-summary?device_token=' + encodeURIComponent(deviceToken));
    setSummary(data);
    if (data.my_rsvp) {
      setQuantity(data.my_rsvp.quantity);
      setNames(normalizedNames(data.my_rsvp.names || [], data.my_rsvp.quantity));
    }
  }

  async function loadParticipants() {
    if (!enabled || !showNames) return;
    const data = await api('/events/' + event.id + '/rsvps-public');
    setParticipants(data);
  }

  useEffect(() => {
    loadSummary().catch((error) => setMessage(error.message));
  }, [event.id, enabled]);

  if (!enabled) return null;

  function changeQuantity(value) {
    const next = Math.max(1, Math.min(10, Number(value) || 1));
    setQuantity(next);
    setNames((current) => normalizedNames(current, next));
  }

  function changeName(index, value) {
    setNames((current) => current.map((name, i) => (i === index ? value : name)));
  }

  async function submitRsvp(formEvent) {
    formEvent.preventDefault();
    setMessage('');
    const method = summary?.already_confirmed ? 'PUT' : 'POST';
    try {
      const data = await api('/events/' + event.id + '/rsvp', {
        method,
        body: JSON.stringify({ device_token: deviceToken, quantity, names })
      });
      setSummary(data);
      setShowForm(false);
      setMessage('Presença confirmada com sucesso.');
      if (showParticipants) await loadParticipants();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function cancelRsvp() {
    if (!window.confirm('Cancelar sua confirmação de presença neste evento?')) return;
    try {
      const data = await api('/events/' + event.id + '/rsvp', {
        method: 'DELETE',
        body: JSON.stringify({ device_token: deviceToken })
      });
      setSummary(data);
      setShowForm(false);
      setQuantity(1);
      setNames(['']);
      setMessage('Confirmação cancelada com sucesso.');
      if (showParticipants) await loadParticipants();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function toggleParticipants() {
    const next = !showParticipants;
    setShowParticipants(next);
    if (next) await loadParticipants();
  }

  return (
    <section className={compact ? 'rsvp-box compact' : 'rsvp-box'}>
      <div className="rsvp-summary-line">
        <Users size={22} aria-hidden="true" />
        <strong>{summary?.total_confirmed || 0} pessoas confirmadas</strong>
      </div>

      {summary?.already_confirmed && (
        <p className="rsvp-confirmed"><CheckCircle2 size={22} aria-hidden="true" />Você já confirmou presença neste evento.</p>
      )}

      <div className="rsvp-actions">
        <button className="rsvp-primary" type="button" onClick={() => setShowForm(true)}>
          <UserRoundCheck size={22} aria-hidden="true" />
          {summary?.already_confirmed ? 'Alterar confirmação' : 'Confirmar presença'}
        </button>
        {summary?.already_confirmed && <button className="rsvp-secondary" type="button" onClick={cancelRsvp}>Cancelar minha confirmação</button>}
        {showNames && <button className="rsvp-secondary" type="button" onClick={toggleParticipants}>Ver participantes</button>}
      </div>

      {message && <p className="rsvp-message">{message}</p>}

      {showForm && (
        <form className="rsvp-form" onSubmit={submitRsvp}>
          <div className="rsvp-form-heading">
            <h3>{summary?.already_confirmed ? 'Alterar confirmação' : 'Confirmar presença'}</h3>
            <button type="button" onClick={() => setShowForm(false)} aria-label="Fechar formulário"><X size={22} /></button>
          </div>
          <label>
            <span>Quantas pessoas irão?</span>
            <input type="number" min="1" max="10" value={quantity} onChange={(e) => changeQuantity(e.target.value)} />
          </label>
          <div className="rsvp-name-grid">
            {Array.from({ length: quantity }, (_, index) => (
              <label key={index}>
                <span>Nome da pessoa {index + 1} (opcional)</span>
                <input value={names[index] || ''} onChange={(e) => changeName(index, e.target.value)} />
              </label>
            ))}
          </div>
          <button className="rsvp-primary wide" type="submit">Confirmar presença</button>
        </form>
      )}

      {showParticipants && showNames && (
        <div className="rsvp-participants">
          <h3>Participantes</h3>
          {participants.length === 0 ? <p>Nenhum nome informado.</p> : (
            <ul>{participants.map((name, index) => <li key={index}>{name || 'Participante'}</li>)}</ul>
          )}
        </div>
      )}
    </section>
  );
}
