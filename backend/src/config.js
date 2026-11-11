import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

export const config = {
  port: Number(process.env.PORT || 3333),
  host: process.env.HOST || '127.0.0.1',
  jwtSecret: process.env.JWT_SECRET || 'agenda-ieclb-dev-secret-change-me',
  databaseFile: path.resolve(backendRoot, process.env.DATABASE_FILE || './data/database.sqlite'),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
};
