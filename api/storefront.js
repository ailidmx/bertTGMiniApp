const DEFAULT_BASE_URL =
  'https://script.google.com/macros/s/AKfycbz6b38smjJ-DNy-7IWJRq2WnnWTFQ6tmR6AKOpWxcIfZSRfM9HooHe7Dvcmb7pgk04IUw/exec';
const DEFAULT_TOKEN = 'BERT2026*';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const baseUrl = process.env.APPS_SCRIPT_BASE_URL || DEFAULT_BASE_URL;
    const token = process.env.APPS_SCRIPT_TOKEN || DEFAULT_TOKEN;
    const url = `${baseUrl}?api=storefront&token=${encodeURIComponent(token)}`;

    const upstream = await fetch(url, { method: 'GET' });
    const raw = await upstream.text();
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Upstream error', status: upstream.status });
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: 'Upstream non-JSON response' });
    }

    return res.status(200).json(payload);
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Proxy failure' });
  }
}
