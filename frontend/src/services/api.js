function getApiUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window === 'undefined') return 'http://localhost:3333/api';

  const { protocol, hostname, port, origin } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://localhost:3333/api';
  if (port === '5173' || port === '4173') return protocol + '//' + hostname + ':3333/api';
  return origin + '/api';
}

export const API_URL = getApiUrl();

export function getToken() {
  return localStorage.getItem('agenda_ieclb_token');
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('agenda_ieclb_user') || 'null');
  } catch {
    return null;
  }
}

export function setToken(token) {
  if (token) localStorage.setItem('agenda_ieclb_token', token);
  else localStorage.removeItem('agenda_ieclb_token');
}

export function setSession(token, user) {
  setToken(token);
  if (user) localStorage.setItem('agenda_ieclb_user', JSON.stringify(user));
  else localStorage.removeItem('agenda_ieclb_user');
}

export function clearSession() {
  setToken(null);
  localStorage.removeItem('agenda_ieclb_user');
}

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;

  let response;
  try {
    response = await fetch(API_URL + path, { ...options, headers });
  } catch {
    throw new Error('Não foi possível conectar ao backend. Confira se o comando npm run backend está rodando em outro PowerShell.');
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error((data && data.message) || 'Não foi possível concluir a operação.');
  }

  return data;
}

export function formatDate(date) {
  if (!date) return '';
  const [year, month, day] = date.split('-');
  return day + '/' + month + '/' + year;
}

export function formatTime(time) {
  if (!time) return '';
  const value = String(time).trim().replace(/[hH]/g, ':');
  const match = value.match(/^(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) return value;
  const hours = String(Math.min(Number(match[1]), 23)).padStart(2, '0');
  const minutes = String(match[2] ? Math.min(Number(match[2]), 59) : 0).padStart(2, '0');
  return hours + ':' + minutes;
}

export function eventTime(event) {
  const start = formatTime(event.start_time);
  const end = formatTime(event.end_time);
  if (start && end) return start + ' às ' + end;
  return start || 'Horário a confirmar';
}


export function getDeviceToken() {
  const key = 'agenda_ieclb_device_token';
  let token = localStorage.getItem(key);
  if (!token) {
    token = 'device-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
    localStorage.setItem(key, token);
  }
  return token;
}
