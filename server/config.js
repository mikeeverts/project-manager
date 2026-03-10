import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONFIG_PATH = join(__dirname, 'db-config.json');

let cachedConfig = null;

export async function loadConfig() {
  try {
    const data = await readFile(CONFIG_PATH, 'utf8');
    cachedConfig = JSON.parse(data);
    return cachedConfig;
  } catch {
    return null;
  }
}

export function hasDbConfig() {
  return cachedConfig !== null;
}

export function getDbConfig() {
  return cachedConfig;
}

export async function saveConfig(config) {
  cachedConfig = config;
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}
