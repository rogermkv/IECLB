import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import { initDatabase, run, db } from '../src/db.js';
import { normalizeDate, normalizeHour, normalizeText } from '../src/utils/events.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const workbookPath = path.join(projectRoot, 'bd.xlsx');

function normalizeKey(key) {
  return String(key || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function keyOf(row, names) {
  const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeKey(key), value]));
  for (const name of names) if (normalized[name] !== undefined) return normalized[name];
  return '';
}

function eventFromRow(row) {
  return {
    date: normalizeDate(keyOf(row, ['data', 'dia'])),
    start_time: normalizeHour(keyOf(row, ['hora inicio', 'hora inicial', 'inicio', 'horario', 'hora'])),
    end_time: normalizeHour(keyOf(row, ['hora fim', 'fim', 'termino', 'hora final'])),
    title: normalizeText(keyOf(row, ['titulo', 'evento', 'atividade', 'programacao'])),
    category: normalizeText(keyOf(row, ['categoria', 'tipo'])),
    location: normalizeText(keyOf(row, ['local', 'lugar'])),
    audience: normalizeText(keyOf(row, ['publico', 'publico alvo', 'participantes'])),
    description: normalizeText(keyOf(row, ['descricao', 'detalhes'])),
    notes: normalizeText(keyOf(row, ['observacoes', 'observacao', 'obs', 'notas']))
  };
}

await initDatabase();
const workbook = XLSX.readFile(workbookPath, { cellDates: true });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: '' });

let imported = 0;
let skipped = 0;

for (const row of rows) {
  const event = eventFromRow(row);
  if (!event.date || !event.title) {
    skipped += 1;
    continue;
  }

  const result = await run(
    'INSERT OR IGNORE INTO events (date, start_time, end_time, title, category, location, audience, description, notes, allow_rsvp, show_rsvp_names_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [event.date, event.start_time, event.end_time, event.title, event.category, event.location, event.audience, event.description, event.notes, 1, 1]
  );

  if (result.changes) imported += 1;
  else skipped += 1;
}

console.log('Importação concluída. Novos eventos: ' + imported + '. Ignorados/duplicados: ' + skipped + '.');
db.close();
