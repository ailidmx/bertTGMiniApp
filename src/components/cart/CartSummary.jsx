import React from 'react';
import SectionCard from '../ui/SectionCard';

const COUNTRY_OPTIONS = [
  { code: 'MX', dial: '+52', label: 'México' },
  { code: 'US', dial: '+1', label: 'USA' },
  { code: 'CA', dial: '+1', label: 'Canadá' },
  { code: 'FR', dial: '+33', label: 'France' },
  { code: 'ES', dial: '+34', label: 'España' }
];
const CUSTOMER_LOCAL_STORAGE_KEY = 'casabert_checkout_customer_v1';

function applyPhoneMask(code, digitsRaw) {
  const digits = String(digitsRaw || '').replace(/\D/g, '').slice(0, 12);

  if (code === 'MX' || code === 'US' || code === 'CA') {
    const d = digits.slice(0, 10);
    const p1 = d.slice(0, 3);
    const p2 = d.slice(3, 6);
    const p3 = d.slice(6, 10);
    if (!p1) return '';
    if (!p2) return `${p1}`;
    if (!p3) return `${p1} ${p2}`;
    return `${p1} ${p2} ${p3}`;
  }

  if (code === 'FR') {
    const d = digits.slice(0, 9);
    return d.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  }

  if (code === 'ES') {
    const d = digits.slice(0, 9);
    const p1 = d.slice(0, 3);
    const p2 = d.slice(3, 6);
    const p3 = d.slice(6, 9);
    return [p1, p2, p3].filter(Boolean).join(' ');
  }

  return digits;
}

function minDigitsByCountry(code) {
  if (code === 'MX' || code === 'US' || code === 'CA') return 10;
  if (code === 'FR' || code === 'ES') return 9;
  return 8;
}

export default function CartSummary({ summary, promo, onCheckout, checkoutLoading, onQtyChange, telegramContext }) {
  const canCheckout = summary.lines.length > 0 && !checkoutLoading;
  const pickupSlots = React.useMemo(
    () => ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00'],
    []
  );

  const earliestPickupDate = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const [step, setStep] = React.useState('cart');
  const [customer, setCustomer] = React.useState({
    name: '',
    phoneCountry: 'MX',
    phone: '',
    email: '',
    pickupDate: earliestPickupDate,
    pickupSlot: pickupSlots[0],
    telegramUserId: telegramContext?.id ? String(telegramContext.id) : '',
    telegramUsername: telegramContext?.username || ''
  });
  const [formNotice, setFormNotice] = React.useState('');

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CUSTOMER_LOCAL_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return;

      setCustomer((prev) => ({
        ...prev,
        name: saved.name || prev.name,
        phoneCountry: saved.phoneCountry || prev.phoneCountry,
        phone: saved.phone || prev.phone,
        email: saved.email || prev.email,
        pickupDate:
          saved.pickupDate && saved.pickupDate >= earliestPickupDate
            ? saved.pickupDate
            : prev.pickupDate,
        pickupSlot: saved.pickupSlot || prev.pickupSlot,
        telegramUserId: saved.telegramUserId || prev.telegramUserId,
        telegramUsername: saved.telegramUsername || prev.telegramUsername
      }));
    } catch {
      // ignore localStorage parsing errors
    }
  }, [earliestPickupDate]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(
        CUSTOMER_LOCAL_STORAGE_KEY,
        JSON.stringify({
          name: customer.name,
          phoneCountry: customer.phoneCountry,
          phone: customer.phone,
          email: customer.email,
          pickupDate: customer.pickupDate,
          pickupSlot: customer.pickupSlot,
          telegramUserId: customer.telegramUserId,
          telegramUsername: customer.telegramUsername
        })
      );
    } catch {
      // ignore localStorage write errors
    }
  }, [customer]);

  React.useEffect(() => {
    setCustomer((prev) => ({
      ...prev,
      telegramUserId: telegramContext?.id ? String(telegramContext.id) : prev.telegramUserId,
      telegramUsername: telegramContext?.username || prev.telegramUsername
    }));
  }, [telegramContext?.id, telegramContext?.username]);

  const canSubmitCustomer =
    customer.name.trim().length >= 2 &&
    customer.phone.replace(/\D/g, '').length >= minDigitsByCountry(customer.phoneCountry) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim()) &&
    customer.pickupDate &&
    customer.pickupDate >= earliestPickupDate &&
    customer.pickupSlot &&
    !checkoutLoading;

  React.useEffect(() => {
    if (!summary.lines.length && step !== 'cart') setStep('cart');
  }, [summary.lines.length, step]);

  const formatInternationalPhone = () => {
    const country = COUNTRY_OPTIONS.find((c) => c.code === customer.phoneCountry) || COUNTRY_OPTIONS[0];
    const digits = customer.phone.replace(/\D/g, '');
    return `${country.dial}${digits}`;
  };

  return (
    <SectionCard
      title="Tu carrito"
      right={<span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">{summary.qty} productos</span>}
    >
      <p className="mb-3 text-sm font-bold text-emerald-800">Total: ${summary.total} MXN</p>

      <div className="mb-3 grid gap-2 md:grid-cols-2">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Promo etiquetas</p>
          <p className="text-sm font-semibold text-emerald-900">{promo.labelsEarned} etiqueta(s) CASABERT en esta compra</p>
          <p className="text-xs text-emerald-700">Te faltan {promo.labelsToNextGift} para 1 regalo por lealtad.</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Promo volumen</p>
          <p className="text-sm font-semibold text-emerald-900">Regalos por compra: {promo.volumeGiftQty}</p>
          <p className="text-xs text-emerald-700">Cada 10 productos te regalamos 2 más 🎁</p>
        </div>
      </div>

      {summary.lines.length === 0 ? (
        <p className="text-sm text-emerald-700">Tu carrito está vacío. Agrega productos 👆</p>
      ) : (
        <>
          <div className="space-y-2">
            {summary.lines.map((line) => (
              <div key={line.key} className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <span className="text-sm text-emerald-900">{line.name}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="grid h-7 w-7 place-items-center rounded-md border border-emerald-300 bg-white font-black text-emerald-800 hover:bg-emerald-100"
                    onClick={() => onQtyChange(line.key, -1)}
                  >
                    -
                  </button>
                  <strong className="min-w-8 text-center text-sm text-emerald-900">x{line.qty}</strong>
                  <button
                    type="button"
                    className="grid h-7 w-7 place-items-center rounded-md border border-emerald-300 bg-white font-black text-emerald-800 hover:bg-emerald-100"
                    onClick={() => onQtyChange(line.key, +1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {step === 'cart' ? (
            <button
              type="button"
              className="mt-3 w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white shadow hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => setStep('customer')}
              disabled={!canCheckout}
            >
              Continuar
            </button>
          ) : (
            <div className="mt-3 space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm font-bold text-emerald-900">Datos para recoger pedido</p>
              <label className="text-xs font-semibold text-emerald-800">
                Nombre completo <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="Nombre"
                required
                className="w-full rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-900 outline-none focus:border-emerald-500"
                value={customer.name}
                onChange={(e) => setCustomer((prev) => ({ ...prev, name: e.target.value }))}
              />

              <label className="text-xs font-semibold text-emerald-800">
                Teléfono (internacional) <span className="text-red-600">*</span>
              </label>
              <div className="flex w-full gap-2">
                <select
                  required
                  className="w-40 rounded-lg border border-emerald-300 bg-white px-2 py-2 text-sm text-emerald-900 outline-none focus:border-emerald-500"
                  value={customer.phoneCountry}
                  onChange={(e) =>
                    setCustomer((prev) => ({
                      ...prev,
                      phoneCountry: e.target.value,
                      phone: applyPhoneMask(e.target.value, prev.phone)
                    }))
                  }
                >
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} {c.dial}
                    </option>
                  ))}
                </select>

                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  placeholder="Teléfono"
                  className="w-full rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-900 outline-none focus:border-emerald-500"
                  value={customer.phone}
                  onChange={(e) =>
                    setCustomer((prev) => ({
                      ...prev,
                      phone: applyPhoneMask(prev.phoneCountry, e.target.value)
                    }))
                  }
                />
              </div>

              <label className="text-xs font-semibold text-emerald-800">
                Correo electrónico <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                placeholder="Correo electrónico"
                required
                className="w-full rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-900 outline-none focus:border-emerald-500"
                value={customer.email}
                onChange={(e) => setCustomer((prev) => ({ ...prev, email: e.target.value }))}
              />

              <label className="text-xs font-semibold text-emerald-800">
                Fecha de recogida <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                required
                min={earliestPickupDate}
                className="w-full rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-900 outline-none focus:border-emerald-500"
                value={customer.pickupDate}
                onChange={(e) => setCustomer((prev) => ({ ...prev, pickupDate: e.target.value }))}
              />

              <label className="text-xs font-semibold text-emerald-800">
                Horario de recogida <span className="text-red-600">*</span>
              </label>
              <select
                required
                className="w-full rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-900 outline-none focus:border-emerald-500"
                value={customer.pickupSlot}
                onChange={(e) => setCustomer((prev) => ({ ...prev, pickupSlot: e.target.value }))}
              >
                {pickupSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              {customer.telegramUserId ? (
                <p className="text-xs font-semibold text-emerald-700">
                  Te confirmamos también por Telegram {customer.telegramUsername ? `(@${customer.telegramUsername})` : ''}.
                </p>
              ) : null}

              <div className="flex gap-2">
                <button
                  type="button"
                  className="w-1/3 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
                  onClick={() => setStep('cart')}
                >
                  Volver
                </button>
                <button
                  type="button"
                  className="w-2/3 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white shadow hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={async () => {
                    const result = await onCheckout({
                      ...customer,
                      phone: formatInternationalPhone()
                    });
                    setFormNotice(
                      result?.ok
                        ? '✅ Pedido confirmado. Te enviamos confirmación por Telegram/correo.'
                        : `⚠️ No se pudo enviar el pedido: ${result?.error || 'error'}`
                    );
                  }}
                  disabled={!canSubmitCustomer}
                >
                  {checkoutLoading ? 'Enviando...' : 'Enviar pedido'}
                </button>
              </div>
              {formNotice ? <p className="text-xs font-semibold text-emerald-800">{formNotice}</p> : null}
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}
