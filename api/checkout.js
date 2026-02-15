const DEFAULT_BASE_URL =
  'https://script.google.com/macros/s/AKfycbz6b38smjJ-DNy-7IWJRq2WnnWTFQ6tmR6AKOpWxcIfZSRfM9HooHe7Dvcmb7pgk04IUw/exec';
const DEFAULT_TOKEN = 'BERT2026*';
const DEFAULT_TELEGRAM_CHAT_ID = '-1003399305702';
const DEFAULT_TELEGRAM_THREAD_ID = '1183';
const DEFAULT_CC = ['david.aili.mx@gmail.com', 'casabert2026@gmail.com', 'benjaminsaksik9@gmail.com'];

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const customer = body?.customer || {};
    const emailTo = String(customer?.email || '').trim();
    const emailCc = Array.isArray(body?.emailCc) && body.emailCc.length ? body.emailCc : DEFAULT_CC;
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHECKOUT_CHAT_ID || DEFAULT_TELEGRAM_CHAT_ID;
    const telegramThreadId = process.env.TELEGRAM_CHECKOUT_THREAD_ID || DEFAULT_TELEGRAM_THREAD_ID;

    if (!telegramToken) {
      return res.status(500).json({ ok: false, error: 'Falta TELEGRAM_BOT_TOKEN en entorno' });
    }

    const message = String(body?.message || '🛒 Nuevo pedido internet (sin detalle)');
    const tgPayload = {
      chat_id: telegramChatId,
      text: message
    };

    if (telegramThreadId) tgPayload.message_thread_id = Number(telegramThreadId);

    const telegramRes = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tgPayload)
    });
    const telegramJson = await telegramRes.json().catch(() => ({}));

    if (!telegramRes.ok || telegramJson?.ok === false) {
      return res.status(502).json({ ok: false, error: 'Telegram sendMessage failed', details: telegramJson });
    }

    let userTelegramConfirmation = { ok: false, skipped: true };
    const userTelegramId = String(customer?.telegramUserId || '').trim();
    if (userTelegramId) {
      const confirmText = [
        '✅ ¡Pedido recibido en CASA BERT!',
        `Gracias ${customer?.name || ''}`.trim(),
        `Recoge: ${customer?.pickupDate || 'N/D'} · ${customer?.pickupSlot || 'N/D'}`,
        `Total estimado: $${Number(body?.totalAmount || 0)} MXN`,
        '',
        'Te esperamos en tienda 💚'
      ].join('\n');

      const userRes = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: userTelegramId,
          text: confirmText
        })
      });

      const userJson = await userRes.json().catch(() => ({}));
      userTelegramConfirmation = {
        ok: userRes.ok && userJson?.ok !== false,
        skipped: false,
        details: userJson
      };
    }

    const baseUrl = process.env.APPS_SCRIPT_BASE_URL || DEFAULT_BASE_URL;
    const token = process.env.APPS_SCRIPT_TOKEN || DEFAULT_TOKEN;
    const apiAction = process.env.APPS_SCRIPT_CHECKOUT_API || 'checkout_internet';
    const sheetUrl = `${baseUrl}?api=${encodeURIComponent(apiAction)}&token=${encodeURIComponent(token)}`;

    const sheetPayload = {
      ...body,
      email: {
        to: emailTo,
        cc: emailCc,
        subject: `Pedido CASA BERT · ${customer?.name || 'Cliente'}`
      },
      sheetRecord: {
        customerName: customer?.name || '',
        customerPhone: customer?.phone || '',
        customerEmail: emailTo,
        pickupDate: customer?.pickupDate || '',
        pickupSlot: customer?.pickupSlot || '',
        totalQty: Number(body?.totalQty || 0),
        totalAmount: Number(body?.totalAmount || 0),
        linesText: (Array.isArray(body?.lines) ? body.lines : [])
          .map((line) => `${line?.name || ''} x${line?.qty || 0}`)
          .join(' | ')
      }
    };

    const sheetRes = await fetch(sheetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sheetPayload)
    });

    const rawSheet = await sheetRes.text();
    let sheetJson;
    try {
      sheetJson = JSON.parse(rawSheet);
    } catch {
      sheetJson = { raw: rawSheet };
    }

    if (!sheetRes.ok) {
      return res.status(502).json({
        ok: false,
        error: 'AppScript checkout_internet failed',
        telegram: telegramJson,
        sheet: sheetJson
      });
    }

    return res.status(200).json({
      ok: true,
      telegram: telegramJson,
      telegramUserConfirmation: userTelegramConfirmation,
      emailRequestedTo: emailTo,
      emailRequestedCc: emailCc,
      sheet: sheetJson
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || 'Checkout proxy failure' });
  }
}
