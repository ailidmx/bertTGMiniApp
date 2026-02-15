import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ENV_PATH = path.join(ROOT, '.env');
const STOREFRONT_PATH = path.join(ROOT, 'src', 'data', 'storefront.json');
const FALLBACK_STOREFRONT_URL = 'https://www.casabert.mx/api/storefront';

function parseEnv(content) {
  const map = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    map[key] = value;
  }
  return map;
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

async function main() {
  const envRaw = await fs.readFile(ENV_PATH, 'utf8');
  const env = parseEnv(envRaw);

  const baseUrl = env.APPS_SCRIPT_BASE_URL;
  const token = env.APPS_SCRIPT_TOKEN;

  if (!baseUrl || !token) {
    throw new Error('Faltan APPS_SCRIPT_BASE_URL o APPS_SCRIPT_TOKEN en .env');
  }

  const candidateUrls = [
    `${baseUrl}?api=storefront&token=${encodeURIComponent(token)}`,
    env.STOREFRONT_REFRESH_URL || FALLBACK_STOREFRONT_URL
  ].filter(Boolean);

  let remote = null;
  let selectedSource = '';
  let lastError = '';

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!isObject(json)) throw new Error('JSON inválido');
      remote = json;
      selectedSource = url;
      break;
    } catch (err) {
      lastError = `${url} -> ${err?.message || err}`;
    }
  }

  if (!remote) {
    throw new Error(`No se pudo obtener storefront remoto. Último error: ${lastError}`);
  }

  if (!isObject(remote)) {
    throw new Error('Respuesta inválida del storefront remoto');
  }

  let local = {};
  try {
    local = JSON.parse(await fs.readFile(STOREFRONT_PATH, 'utf8'));
  } catch {
    local = {};
  }

  const localPlaceId = local?.location?.placeId || local?.location?.place_id || '';
  const remoteLocation = isObject(remote.location) ? remote.location : {};

  const merged = {
    ...remote,
    location: {
      ...remoteLocation,
      placeId: String(remoteLocation.placeId || remoteLocation.place_id || localPlaceId || '').trim()
    }
  };

  await fs.writeFile(STOREFRONT_PATH, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');

  const categories = Array.isArray(merged.catalog) ? merged.catalog.length : 0;
  const items = Array.isArray(merged.catalog)
    ? merged.catalog.reduce((acc, c) => acc + (Array.isArray(c?.items) ? c.items.length : 0), 0)
    : 0;

  console.log('✅ storefront.json actualizado');
  console.log(`- source: ${selectedSource}`);
  console.log(`- categories: ${categories}`);
  console.log(`- items: ${items}`);
  console.log(`- placeId: ${merged?.location?.placeId || '(vacío)'}`);
}

main().catch((err) => {
  console.error(`❌ refresh-storefront falló: ${err?.message || err}`);
  process.exit(1);
});
