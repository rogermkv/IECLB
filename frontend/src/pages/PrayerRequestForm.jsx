import { HeartHandshake, Send } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';

export default function PrayerRequestForm() {
  const [form, setForm] = useState({ name: '', request_text: '', visibility: 'private' });
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    try {
      await api('/prayer-requests', { method: 'POST', body: JSON.stringify(form) });
      setForm({ name: '', request_text: '', visibility: 'private' });
      setSuccess(true);
      setMessage('Seu pedido foi enviado com sucesso.\n\nA Secretaria analisará o pedido antes da publicação.\n\nQue Deus fortaleça você e sua família.');
    } catch (error) {
      setSuccess(false);
      setMessage(error.message);
    }
  }

  return (
    <main className="content-section page-section prayer-page narrow">
      <section className="prayer-form-card">
        <div className="prayer-page-heading">
          <span><HeartHandshake size={34} aria-hidden="true" /></span>
          <div>
            <p className="eyebrow">Pedidos de Oração</p>
            <h1>Fazer um pedido</h1>
          </div>
        </div>
        <p className="prayer-intro">Compartilhe seu pedido com carinho. Não é preciso fazer login e o nome é opcional.</p>
        {message && <p className={success ? 'prayer-success' : 'status-message'}>{message}</p>}
        <form className="admin-form" onSubmit={submit}>
          <label><span>Nome (opcional)</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label><span>Pedido de oração *</span><textarea rows="7" value={form.request_text} onChange={(e) => setForm({ ...form, request_text: e.target.value })} required /></label>
          <label><span>Visibilidade</span><select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
            <option value="private">Somente Secretaria e Grupo de Oração</option>
            <option value="public_requested">Pode ser publicado para a comunidade após aprovação</option>
          </select></label>
          <button className="prayer-primary-button" type="submit"><Send size={24} aria-hidden="true" /> Enviar pedido</button>
        </form>
        <Link className="prayer-secondary-link" to="/oracao">Ver pedidos públicos</Link>
      </section>
    </main>
  );
}
