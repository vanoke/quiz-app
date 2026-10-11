import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Явный абсолютный путь + override, чтобы обойти кэш dotenv
dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
  override: true,
});