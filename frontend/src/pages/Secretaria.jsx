import { Bell, CalendarDays, CheckCircle2, Edit3, HeartHandshake, Lock, LogOut, Plus, Save, Search, Settings, Trash2, UsersRound, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { API_URL, api, eventTime, formatDate, getToken, setToken } from '../services/api.js';

const emptyEvent = { date: '', start_time: '', end_time: '', title: '', category: '', location: '', audience: '', description: '', notes: '', allow_rsvp: true, show_rsvp_names_public: true };
const emptyAnnouncement = { title: '', message: '', type: 'Normal', start_date: '', end_date: '', is_active: true };
const emptyPrayerRequest = { name: '', request_text: '', visibility: 'private', status: 'pending' };
const prayerStatusLabels = { pending: 'Pendentes', public: 'Públicos', private: 'Privados', archived: 'Arquivados' };
const adminSections = [
  { id: 'dashboard', label: 'Dashboard', icon: CalendarDays },
  { id: 'events', label: 'Eventos', icon: CalendarDays },
  { id: 'announcements', label: 'Avisos', icon: Bell },
  { id: 'prayers', label: 'Pedidos de Oração', icon: HeartHandshake },
  { id: 'settings', label: 'Configurações', icon: Settings }
];

function normalizeNames(names, quantity) {
  return Array.from({ length: quantity }, (_, index) => names[index] || '');
}

function activeAnnouncement(announcement) {
  const today = new Date().toISOString().slice(0, 10);
  const starts = !announcement.start_date || announcement.start_date <= today;
  const ends = !announcement.end_date || announcement.end_date >= today;
  return Boolean(announcement.is_active) && starts && ends;
}

function statusText(status) {
  return prayerStatusLabels[status] || status;
}

export default function Secretaria() {
  const [logged, setLogged] = useState(Boolean(getToken()));
  const [activeSection, setActiveSection] = useState('dashboard');
  const [login, setLogin] = useState({ username: 'secretaria', password: '' });
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [rsvpTotals, setRsvpTotals] = useState({});
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [announcementForm, setAnnouncementForm] = useState(emptyAnnouncement);
  const [prayerForm, setPrayerForm] = useState(emptyPrayerRequest);
  const [editingEventId, setEditingEventId] = useState(null);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
  const [editingPrayerId, setEditingPrayerId] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [eventSearch, setEventSearch] = useState('');
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [eventFilters, setEventFilters] = useState({ month: '', category: '', location: '' });
  const [visibleEventCount, setVisibleEventCount] = useState(30);
  const [prayerStatusFilter, setPrayerStatusFilter] = useState('pending');
  const [selectedRsvpEvent, setSelectedRsvpEvent] = useState(null);
  const [eventRsvps, setEventRsvps] = useState([]);
  const [editingRsvpId, setEditingRsvpId] = useState(null);
  const [rsvpForm, setRsvpForm] = useState({ quantity: 1, names: [''] });
  const [notice, setNotice] = useState('');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });

  useEffect(() => {
    if (logged) loadAll();
  }, [logged]);

  useEffect(() => {
    if (logged && activeSection === 'prayers') loadPrayerRequests();
  }, [activeSection, logged]);

  function show(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 5000);
  }

  async function loadAll() {
    await Promise.all([loadEvents(), loadAnnouncements(), loadPrayerRequests()]);
  }

  async function loadEvents() {
    try {
      const data = await api('/admin/events');
      setEvents(data);
      const totals = {};
      await Promise.all(data.filter((event) => event.allow_rsvp).map(async (event) => {
        try {
          const rows = await api('/admin/events/' + event.id + '/rsvps');
          totals[event.id] = rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
        } catch {
          totals[event.id] = 0;
        }
      }));
      setRsvpTotals(totals);
    } catch (error) { show(error.message); }
  }

  async function loadAnnouncements() {
    try { setAnnouncements(await api('/admin/announcements')); }
    catch (error) { show(error.message); }
  }

  async function loadPrayerRequests() {
    try { setPrayerRequests(await api('/admin/prayer-requests')); }
    catch (error) { show(error.message); }
  }

  async function doLogin(event) {
    event.preventDefault();
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify(login) });
      setToken(data.token);
      setLogged(true);
      show('Login realizado com sucesso.');
    } catch (error) { show(error.message); }
  }

  function newEvent() {
    setEditingEventId(null);
    setEventForm(emptyEvent);
    setShowEventForm(true);
    setSelectedRsvpEvent(null);
  }

  function editEvent(event) {
    setEditingEventId(event.id);
    setEventForm({
      date: event.date || '', start_time: event.start_time || '', end_time: event.end_time || '', title: event.title || '',
      category: event.category || '', location: event.location || '', audience: event.audience || '', description: event.description || '', notes: event.notes || '',
      allow_rsvp: Boolean(event.allow_rsvp), show_rsvp_names_public: event.show_rsvp_names_public !== 0
    });
    setShowEventForm(true);
    setSelectedRsvpEvent(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveEvent(event) {
    event.preventDefault();
    try {
      const method = editingEventId ? 'PUT' : 'POST';
      const path = editingEventId ? '/admin/events/' + editingEventId : '/admin/events';
      await api(path, { method, body: JSON.stringify(eventForm) });
      setEventForm(emptyEvent);
      setEditingEventId(null);
      setShowEventForm(false);
      await loadEvents();
      show(editingEventId ? 'Evento atualizado com sucesso.' : 'Evento cadastrado com sucesso.');
    } catch (error) { show(error.message); }
  }

  async function deleteEvent(id) {
    if (!window.confirm('Tem certeza que deseja excluir este evento?')) return;
    try {
      await api('/admin/events/' + id, { method: 'DELETE' });
      await loadEvents();
      show('Evento excluído com sucesso.');
    } catch (error) { show(error.message); }
  }

  function newAnnouncement() {
    setEditingAnnouncementId(null);
    setAnnouncementForm(emptyAnnouncement);
    setShowAnnouncementForm(true);
  }

  function editAnnouncement(announcement) {
    setEditingAnnouncementId(announcement.id);
    setAnnouncementForm({ title: announcement.title || '', message: announcement.message || '', type: announcement.type || 'Normal', start_date: announcement.start_date || '', end_date: announcement.end_date || '', is_active: Boolean(announcement.is_active) });
    setShowAnnouncementForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveAnnouncement(event) {
    event.preventDefault();
    try {
      const method = editingAnnouncementId ? 'PUT' : 'POST';
      const path = editingAnnouncementId ? '/admin/announcements/' + editingAnnouncementId : '/admin/announcements';
      await api(path, { method, body: JSON.stringify(announcementForm) });
      setAnnouncementForm(emptyAnnouncement);
      setEditingAnnouncementId(null);
      setShowAnnouncementForm(false);
      await loadAnnouncements();
      show(editingAnnouncementId ? 'Aviso atualizado com sucesso.' : 'Aviso cadastrado com sucesso.');
    } catch (error) { show(error.message); }
  }

  async function archiveAnnouncement(announcement) {
    try {
      await api('/admin/announcements/' + announcement.id, { method: 'PUT', body: JSON.stringify({ ...announcement, is_active: 0, end_date: new Date().toISOString().slice(0, 10) }) });
      await loadAnnouncements();
      show('Aviso arquivado com sucesso.');
    } catch (error) { show(error.message); }
  }

  async function deleteAnnouncement(id) {
    if (!window.confirm('Tem certeza que deseja excluir este aviso?')) return;
    try {
      await api('/admin/announcements/' + id, { method: 'DELETE' });
      await loadAnnouncements();
      show('Aviso excluído com sucesso.');
    } catch (error) { show(error.message); }
  }

  function editPrayerRequest(request) {
    setEditingPrayerId(request.id);
    setPrayerForm({ name: request.name || '', request_text: request.request_text || '', visibility: request.visibility || 'private', status: request.status || 'pending' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function savePrayerRequest(event) {
    event.preventDefault();
    if (!editingPrayerId) return;
    try {
      await api('/admin/prayer-requests/' + editingPrayerId, { method: 'PUT', body: JSON.stringify(prayerForm) });
      setEditingPrayerId(null);
      setPrayerForm(emptyPrayerRequest);
      await loadPrayerRequests();
      show('Pedido de oração atualizado com sucesso.');
    } catch (error) { show(error.message); }
  }

  async function updatePrayerStatus(id, status) {
    try {
      await api('/admin/prayer-requests/' + id + '/status', { method: 'PUT', body: JSON.stringify({ status }) });
      await loadPrayerRequests();
      show('Status atualizado com sucesso.');
    } catch (error) { show(error.message); }
  }

  async function deletePrayerRequest(id) {
    if (!window.confirm('Tem certeza que deseja excluir este pedido de oração?')) return;
    try {
      await api('/admin/prayer-requests/' + id, { method: 'DELETE' });
      if (editingPrayerId === id) {
        setEditingPrayerId(null);
        setPrayerForm(emptyPrayerRequest);
      }
      await loadPrayerRequests();
      show('Pedido excluído com sucesso.');
    } catch (error) { show(error.message); }
  }

  async function openRsvps(event) {
    setSelectedRsvpEvent(event);
    setEditingRsvpId(null);
    setRsvpForm({ quantity: 1, names: [''] });
    try { setEventRsvps(await api('/admin/events/' + event.id + '/rsvps')); }
    catch (error) { show(error.message); }
  }

  function editRsvp(rsvp) {
    const quantity = Number(rsvp.quantity || 1);
    setEditingRsvpId(rsvp.id);
    setRsvpForm({ quantity, names: normalizeNames(rsvp.names || [], quantity) });
  }

  function changeRsvpQuantity(value) {
    const quantity = Math.max(1, Math.min(10, Number(value) || 1));
    setRsvpForm((current) => ({ ...current, quantity, names: normalizeNames(current.names, quantity) }));
  }

  async function saveAdminRsvp(event) {
    event.preventDefault();
    if (!editingRsvpId) return;
    try {
      await api('/admin/rsvps/' + editingRsvpId, { method: 'PUT', body: JSON.stringify(rsvpForm) });
      await openRsvps(selectedRsvpEvent);
      await loadEvents();
      show('Confirmação atualizada com sucesso.');
    } catch (error) { show(error.message); }
  }

  async function deleteAdminRsvp(id) {
    if (!window.confirm('Excluir esta confirmação?')) return;
    try {
      await api('/admin/rsvps/' + id, { method: 'DELETE' });
      await openRsvps(selectedRsvpEvent);
      await loadEvents();
      show('Confirmação excluída com sucesso.');
    } catch (error) { show(error.message); }
  }

  function exportRsvps() {
    if (!selectedRsvpEvent) return;
    fetch(API_URL + '/admin/events/' + selectedRsvpEvent.id + '/rsvps/export', { headers: { Authorization: 'Bearer ' + getToken() } })
      .then((response) => {
        if (!response.ok) throw new Error('Não foi possível exportar as confirmações.');
        return response.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'confirmacoes-evento-' + selectedRsvpEvent.id + '.csv';
        link.click();
        URL.revokeObjectURL(url);
      })
      .catch((error) => show(error.message));
  }

  async function changePassword(event) {
    event.preventDefault();
    try {
      const data = await api('/auth/change-password', { method: 'POST', body: JSON.stringify(passwords) });
      setPasswords({ currentPassword: '', newPassword: '' });
      show(data.message);
    } catch (error) { show(error.message); }
  }

  const categories = useMemo(() => [...new Set(events.map((event) => event.category).filter(Boolean))].sort(), [events]);
  const locations = useMemo(() => [...new Set(events.map((event) => event.location).filter(Boolean))].sort(), [events]);
  const today = new Date().toISOString().slice(0, 10);

  const filteredEvents = useMemo(() => {
    const term = eventSearch.toLowerCase().trim();
    return [...events]
      .sort((a, b) => {
        const aFuture = a.date >= today ? 0 : 1;
        const bFuture = b.date >= today ? 0 : 1;
        return aFuture - bFuture || (a.date + ' ' + (a.start_time || '99')).localeCompare(b.date + ' ' + (b.start_time || '99'));
      })
      .filter((event) => {
        const searchOk = !term || [event.title, event.category, event.location, event.audience].join(' ').toLowerCase().includes(term);
        const monthOk = !eventFilters.month || event.date.startsWith(eventFilters.month);
        const categoryOk = !eventFilters.category || event.category === eventFilters.category;
        const locationOk = !eventFilters.location || event.location === eventFilters.location;
        return searchOk && monthOk && categoryOk && locationOk;
      });
  }, [events, eventSearch, eventFilters, today]);

  const visibleEvents = filteredEvents.slice(0, visibleEventCount);

  const filteredAnnouncements = useMemo(() => {
    const term = announcementSearch.toLowerCase().trim();
    return announcements.filter((announcement) => !term || [announcement.title, announcement.message, announcement.type].join(' ').toLowerCase().includes(term));
  }, [announcements, announcementSearch]);

  const prayerCounts = useMemo(() => ({
    pending: prayerRequests.filter((request) => request.status === 'pending').length,
    public: prayerRequests.filter((request) => request.status === 'public').length,
    private: prayerRequests.filter((request) => request.status === 'private').length,
    archived: prayerRequests.filter((request) => request.status === 'archived').length
  }), [prayerRequests]);

  const filteredPrayerRequests = useMemo(() => prayerRequests.filter((request) => request.status === prayerStatusFilter), [prayerRequests, prayerStatusFilter]);

  const dashboard = {
    events: events.length,
    activeAnnouncements: announcements.filter(activeAnnouncement).length,
    pendingPrayers: prayerCounts.pending,
    rsvpPeople: Object.values(rsvpTotals).reduce((sum, count) => sum + Number(count || 0), 0)
  };

  if (!logged) {
    return (
      <main className="content-section page-section narrow">
        <section className="admin-panel">
          <p className="eyebrow">Área administrativa</p>
          <h1>Secretaria</h1>
          {notice && <p className="notice">{notice}</p>}
          <form className="admin-form" onSubmit={doLogin}>
            <label><span>Usuário</span><input value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} required /></label>
            <label><span>Senha</span><input type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} required /></label>
            <button className="button primary" type="submit"><Lock size={20} /> Entrar</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-title-wrap">
          <img src="/logo.jpg" alt="Logo IECLB" />
          <div><p className="eyebrow">Área administrativa</p><h1>Secretaria</h1></div>
        </div>
        <button className="button ghost" onClick={() => { setToken(null); setLogged(false); }}><LogOut size={20} /> Sair</button>
      </header>
      {notice && <p className="notice admin-notice">{notice}</p>}

      <div className="admin-workspace">
        <nav className="admin-side-menu" aria-label="Menu administrativo">
          {adminSections.map((section) => {
            const Icon = section.icon;
            return <button key={section.id} className={activeSection === section.id ? 'active' : ''} type="button" onClick={() => setActiveSection(section.id)}><Icon size={24} />{section.label}</button>;
          })}
        </nav>

        <section className="admin-content-area">
          {activeSection === 'dashboard' && (
            <div className="admin-dashboard">
              <div className="admin-section-heading"><h2>Dashboard</h2><p>Resumo rápido da comunidade.</p></div>
              <div className="admin-summary-grid">
                <article><CalendarDays size={32} /><span>Eventos cadastrados</span><strong>{dashboard.events}</strong></article>
                <article><Bell size={32} /><span>Avisos ativos</span><strong>{dashboard.activeAnnouncements}</strong></article>
                <article><HeartHandshake size={32} /><span>Pedidos de oração pendentes</span><strong>{dashboard.pendingPrayers}</strong></article>
                <article><UsersRound size={32} /><span>Confirmações de presença</span><strong>{dashboard.rsvpPeople}</strong></article>
              </div>
            </div>
          )}

          {activeSection === 'events' && (
            <div className="admin-section-stack">
              <div className="admin-section-heading row"><div><h2>Eventos</h2><p>Próximos eventos aparecem primeiro. A lista mostra {visibleEvents.length} de {filteredEvents.length}.</p></div><button className="button primary" onClick={newEvent}><Plus size={20} /> Novo evento</button></div>
              {showEventForm && (
                <form className="admin-form admin-panel" onSubmit={saveEvent}>
                  <div className="section-heading compact"><h2>{editingEventId ? 'Editar evento' : 'Cadastrar evento'}</h2><button className="button ghost" type="button" onClick={() => setShowEventForm(false)}><X size={20} /> Fechar</button></div>
                  <div className="form-grid">
                    <label><span>Data *</span><input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} required /></label>
                    <label><span>Hora início</span><input placeholder="19:00" value={eventForm.start_time} onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })} /></label>
                    <label><span>Hora fim</span><input placeholder="20:00" value={eventForm.end_time} onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })} /></label>
                    <label><span>Título *</span><input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} required /></label>
                    <label><span>Categoria</span><input value={eventForm.category} onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })} /></label>
                    <label><span>Local</span><input value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} /></label>
                    <label><span>Público</span><input value={eventForm.audience} onChange={(e) => setEventForm({ ...eventForm, audience: e.target.value })} /></label>
                    <label><span>Permitir confirmação de presença</span><select value={eventForm.allow_rsvp ? '1' : '0'} onChange={(e) => setEventForm({ ...eventForm, allow_rsvp: e.target.value === '1' })}><option value="1">Sim</option><option value="0">Não</option></select></label>
                    <label><span>Mostrar nomes publicamente</span><select value={eventForm.show_rsvp_names_public ? '1' : '0'} onChange={(e) => setEventForm({ ...eventForm, show_rsvp_names_public: e.target.value === '1' })}><option value="1">Sim</option><option value="0">Não</option></select></label>
                  </div>
                  <label><span>Descrição</span><textarea rows="4" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} /></label>
                  <label><span>Observações</span><textarea rows="3" value={eventForm.notes} onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })} /></label>
                  <div className="button-row"><button className="button primary" type="submit"><Save size={20} /> Salvar</button><button className="button ghost" type="button" onClick={() => { setEditingEventId(null); setEventForm(emptyEvent); setShowEventForm(false); }}>Cancelar</button></div>
                </form>
              )}
              <section className="admin-panel">
                <div className="admin-filter-grid">
                  <label className="wide-search"><span>Pesquisar eventos</span><input value={eventSearch} onChange={(e) => { setEventSearch(e.target.value); setVisibleEventCount(30); }} placeholder="Digite título, local, categoria ou público" /></label>
                  <label><span>Mês</span><input type="month" value={eventFilters.month} onChange={(e) => { setEventFilters({ ...eventFilters, month: e.target.value }); setVisibleEventCount(30); }} /></label>
                  <label><span>Categoria</span><select value={eventFilters.category} onChange={(e) => { setEventFilters({ ...eventFilters, category: e.target.value }); setVisibleEventCount(30); }}><option value="">Todas</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                  <label><span>Local</span><select value={eventFilters.location} onChange={(e) => { setEventFilters({ ...eventFilters, location: e.target.value }); setVisibleEventCount(30); }}><option value="">Todos</option>{locations.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                </div>
                <div className="admin-event-list">
                  {visibleEvents.map((event) => (
                    <article key={event.id} className="admin-event-row">
                      <div><strong>{event.title}</strong><span>{formatDate(event.date)} • {eventTime(event)} • {event.location || 'Local não informado'}</span>{event.allow_rsvp ? <span>👥 {rsvpTotals[event.id] || 0} confirmados</span> : null}</div>
                      <div className="button-row small">{event.allow_rsvp ? <button className="button ghost" type="button" onClick={() => openRsvps(event)}>Ver confirmações</button> : null}<button className="icon-button" onClick={() => editEvent(event)} aria-label="Editar evento"><Edit3 size={20} /></button><button className="icon-button danger" onClick={() => deleteEvent(event.id)} aria-label="Excluir evento"><Trash2 size={20} /></button></div>
                    </article>
                  ))}
                  {visibleEvents.length === 0 && <p className="status-message">Nenhum evento encontrado.</p>}
                </div>
                {visibleEventCount < filteredEvents.length && <button className="button secondary load-more-button" onClick={() => setVisibleEventCount((count) => count + 30)}>Mostrar mais eventos</button>}
              </section>
              {selectedRsvpEvent && (
                <section className="admin-panel rsvp-admin-panel">
                  <div className="section-heading compact"><h2>Confirmações: {selectedRsvpEvent.title}</h2><div className="button-row"><button className="button secondary" type="button" onClick={exportRsvps}>Exportar CSV</button><button className="button ghost" type="button" onClick={() => setSelectedRsvpEvent(null)}>Fechar</button></div></div>
                  {editingRsvpId && <form className="admin-form rsvp-admin-form" onSubmit={saveAdminRsvp}><label><span>Quantidade</span><input type="number" min="1" max="10" value={rsvpForm.quantity} onChange={(e) => changeRsvpQuantity(e.target.value)} /></label><div className="form-grid">{Array.from({ length: rsvpForm.quantity }, (_, index) => <label key={index}><span>Nome {index + 1}</span><input value={rsvpForm.names[index] || ''} onChange={(e) => setRsvpForm((current) => ({ ...current, names: current.names.map((name, i) => i === index ? e.target.value : name) }))} /></label>)}</div><div className="button-row"><button className="button primary" type="submit">Salvar confirmação</button><button className="button ghost" type="button" onClick={() => setEditingRsvpId(null)}>Cancelar</button></div></form>}
                  <div className="admin-event-list">{eventRsvps.map((rsvp) => <article className="admin-event-row" key={rsvp.id}><div><strong>{rsvp.quantity} pessoa(s)</strong><span>{(rsvp.names || []).map((name) => name || 'Participante').join(', ') || 'Participante'}</span><span>Confirmado em {rsvp.created_at}</span></div><div className="button-row small"><button className="icon-button" type="button" onClick={() => editRsvp(rsvp)} aria-label="Editar confirmação"><Edit3 size={20} /></button><button className="icon-button danger" type="button" onClick={() => deleteAdminRsvp(rsvp.id)} aria-label="Excluir confirmação"><Trash2 size={20} /></button></div></article>)}{eventRsvps.length === 0 && <p className="status-message">Nenhuma confirmação neste evento.</p>}</div>
                </section>
              )}
            </div>
          )}

          {activeSection === 'announcements' && (
            <div className="admin-section-stack">
              <div className="admin-section-heading row"><div><h2>Avisos</h2><p>Gerencie avisos ativos, agendados e arquivados.</p></div><button className="button primary" onClick={newAnnouncement}><Plus size={20} /> Novo aviso</button></div>
              {showAnnouncementForm && <form className="admin-form admin-panel" onSubmit={saveAnnouncement}><div className="section-heading compact"><h2>{editingAnnouncementId ? 'Editar aviso' : 'Cadastrar aviso'}</h2><button className="button ghost" type="button" onClick={() => setShowAnnouncementForm(false)}><X size={20} /> Fechar</button></div><label><span>Título *</span><input value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} required /></label><label><span>Mensagem *</span><textarea rows="5" value={announcementForm.message} onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })} required /></label><div className="form-grid"><label><span>Tipo</span><select value={announcementForm.type} onChange={(e) => setAnnouncementForm({ ...announcementForm, type: e.target.value })}><option>Normal</option><option>Importante</option><option>Urgente</option></select></label><label><span>Ativo</span><select value={announcementForm.is_active ? '1' : '0'} onChange={(e) => setAnnouncementForm({ ...announcementForm, is_active: e.target.value === '1' })}><option value="1">Sim</option><option value="0">Não</option></select></label><label><span>Data inicial</span><input type="date" value={announcementForm.start_date} onChange={(e) => setAnnouncementForm({ ...announcementForm, start_date: e.target.value })} /></label><label><span>Data limite</span><input type="date" value={announcementForm.end_date} onChange={(e) => setAnnouncementForm({ ...announcementForm, end_date: e.target.value })} /></label></div><div className="button-row"><button className="button primary" type="submit"><Save size={20} /> Salvar aviso</button><button className="button ghost" type="button" onClick={() => { setEditingAnnouncementId(null); setAnnouncementForm(emptyAnnouncement); setShowAnnouncementForm(false); }}>Cancelar</button></div></form>}
              <section className="admin-panel"><label className="wide-search admin-announcement-search"><span>Pesquisar avisos</span><input value={announcementSearch} onChange={(e) => setAnnouncementSearch(e.target.value)} placeholder="Digite título, mensagem ou tipo" /></label><div className="admin-event-list">{filteredAnnouncements.map((announcement) => <article key={announcement.id} className={'admin-event-row admin-announcement-row ' + announcement.type.toLowerCase()}><div><strong>{announcement.title}</strong><span>{announcement.type} • {announcement.is_active ? 'Ativo' : 'Inativo'} • {announcement.end_date ? 'Até ' + formatDate(announcement.end_date) : 'Sem data limite'}</span><p>{announcement.message}</p></div><div className="button-row small"><button className="button ghost" type="button" onClick={() => editAnnouncement(announcement)}>Editar</button><button className="button ghost" type="button" onClick={() => archiveAnnouncement(announcement)}>Arquivar</button><button className="icon-button danger" onClick={() => deleteAnnouncement(announcement.id)} aria-label="Excluir aviso"><Trash2 size={20} /></button></div></article>)}{filteredAnnouncements.length === 0 && <p className="status-message">Nenhum aviso encontrado.</p>}</div></section>
            </div>
          )}

          {activeSection === 'prayers' && (
            <section className="admin-panel prayer-admin-panel">
              <div className="admin-section-heading"><h2>Pedidos de Oração</h2><p>Acompanhe, corrija e aprove pedidos enviados pela comunidade.</p></div>
              <div className="prayer-admin-tabs">{Object.entries(prayerStatusLabels).map(([status, label]) => <button key={status} type="button" className={prayerStatusFilter === status ? 'active' : ''} onClick={() => setPrayerStatusFilter(status)}>({prayerCounts[status] || 0}) {label}</button>)}</div>
              {editingPrayerId && <form className="admin-form prayer-edit-form" onSubmit={savePrayerRequest}><h3>Editar pedido</h3><label><span>Nome</span><input value={prayerForm.name} onChange={(e) => setPrayerForm({ ...prayerForm, name: e.target.value })} /></label><label><span>Pedido</span><textarea rows="6" value={prayerForm.request_text} onChange={(e) => setPrayerForm({ ...prayerForm, request_text: e.target.value })} required /></label><div className="form-grid"><label><span>Visibilidade</span><select value={prayerForm.visibility} onChange={(e) => setPrayerForm({ ...prayerForm, visibility: e.target.value })}><option value="private">Somente Secretaria</option><option value="public_requested">Pode ser publicado</option></select></label><label><span>Status</span><select value={prayerForm.status} onChange={(e) => setPrayerForm({ ...prayerForm, status: e.target.value })}><option value="pending">Pendente</option><option value="public">Público</option><option value="private">Privado</option><option value="archived">Arquivado</option></select></label></div><div className="button-row"><button className="button primary" type="submit">Salvar pedido</button><button className="button ghost" type="button" onClick={() => { setEditingPrayerId(null); setPrayerForm(emptyPrayerRequest); }}>Cancelar</button></div></form>}
              <div className="prayer-admin-list">{filteredPrayerRequests.map((request) => <article className="prayer-admin-card" key={request.id}><div><p className="prayer-admin-label">Nome:</p><strong>{request.name || 'Não informado'}</strong></div><div><p className="prayer-admin-label">Pedido:</p><p>{request.request_text}</p></div><div className="prayer-admin-meta"><span>Visibilidade: {request.visibility === 'public_requested' ? 'Público após aprovação' : 'Privado'}</span><span>Status: {statusText(request.status)}</span><span>Quantidade: {request.prayer_count || 0} membros da comunidade estão orando por este pedido.</span></div><div className="button-row"><button className="button secondary" type="button" onClick={() => updatePrayerStatus(request.id, 'public')}>Aprovar</button><button className="button ghost" type="button" onClick={() => updatePrayerStatus(request.id, 'private')}>Tornar privado</button><button className="button ghost" type="button" onClick={() => editPrayerRequest(request)}>Editar</button><button className="button ghost" type="button" onClick={() => updatePrayerStatus(request.id, 'archived')}>Arquivar</button><button className="button ghost danger-text" type="button" onClick={() => deletePrayerRequest(request.id)}>Excluir</button></div></article>)}{filteredPrayerRequests.length === 0 && <p className="status-message">Nenhum pedido encontrado nesta categoria.</p>}</div>
            </section>
          )}

          {activeSection === 'settings' && (
            <section className="admin-panel settings-panel"><div className="admin-section-heading"><h2>Configurações</h2><p>Altere a senha de acesso da Secretaria.</p></div><form className="admin-form settings-form" onSubmit={changePassword}><label><span>Senha atual</span><input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} required /></label><label><span>Nova senha</span><input type="password" minLength="6" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} required /></label><button className="button primary" type="submit"><Lock size={20} /> Alterar senha</button></form></section>
          )}
        </section>
      </div>
    </main>
  );
}
