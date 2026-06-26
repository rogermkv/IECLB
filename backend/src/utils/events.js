export function normalizeText(value) {
  return String(value || '').trim();
}

export function normalizeDate(value) {
  if (value && typeof value.getTime === 'function' && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const raw = normalizeText(value);
  if (!raw) return '';

  const brMatch = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    const year = brMatch[3].length === 2 ? '20' + brMatch[3] : brMatch[3];
    return year + '-' + month + '-' + day;
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) return isoMatch[1] + '-' + isoMatch[2].padStart(2, '0') + '-' + isoMatch[3].padStart(2, '0');
  return '';
}

export function normalizeHour(value) {
  if (typeof value === 'number') {
    const totalMinutes = Math.round(value * 24 * 60);
    const hours = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
    const minutes = String(totalMinutes % 60).padStart(2, '0');
    return minutes === '00' ? hours : hours + ':' + minutes;
  }

  const raw = normalizeText(value).replace(/[hH]/g, ':');
  if (!raw) return '';
  const match = raw.match(/^(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) return raw;

  const hours = Math.min(Number(match[1]), 23);
  const minutes = match[2] ? Math.min(Number(match[2]), 59) : 0;
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return minutes === 0 ? hh : hh + ':' + mm;
}

function toBooleanFlag(value, defaultValue = 0) {
  if (value === undefined || value === null || value === '') return defaultValue;
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'Sim' ? 1 : 0;
}

export function validateEventPayload(payload) {
  const event = {
    date: normalizeDate(payload.date),
    start_time: normalizeHour(payload.start_time),
    end_time: normalizeHour(payload.end_time),
    title: normalizeText(payload.title),
    category: normalizeText(payload.category),
    location: normalizeText(payload.location),
    audience: normalizeText(payload.audience),
    description: normalizeText(payload.description),
    notes: normalizeText(payload.notes),
    allow_rsvp: toBooleanFlag(payload.allow_rsvp, 1),
    show_rsvp_names_public: toBooleanFlag(payload.show_rsvp_names_public, 1)
  };

  const errors = [];
  if (!event.date) errors.push('Informe uma data válida.');
  if (!event.title) errors.push('Informe o título do evento.');
  return { event, errors };
}
