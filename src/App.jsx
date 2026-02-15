import React, { useEffect, useMemo, useState } from 'react';
import HeroSection from './components/sections/HeroSection';
import ProductCarousel from './components/catalog/ProductCarousel';
import CategoryFilterCloud from './components/catalog/CategoryFilterCloud';
import CartSummary from './components/cart/CartSummary';
import GitProductGallery from './components/gallery/GitProductGallery';
import SocialGallery from './components/gallery/SocialGallery';
import GoogleMapGalleryWidget from './components/gallery/GoogleMapGalleryWidget';
import InstagramGalleryWidget from './components/gallery/InstagramGalleryWidget';
import ToastNotice from './components/ui/ToastNotice';
import storefrontLocal from './data/storefront.json';
import promoBg from './assets/LOGO.jpg';

const FIXED_PRICE = 15;
const APP_VERSION = '1.0.0';
const BUILD_DATE = '2026-02-14 19:27 (MX)';
const DEFAULT_INSTAGRAM_URL = 'https://www.instagram.com/casa_bert/?hl=en';
const GITHUB_PRODUCT_CONTENTS_API = 'https://api.github.com/repos/ailidmx/BertClient/contents/img/product';
const CHECKOUT_API_URL = import.meta.env.VITE_CHECKOUT_API_URL || 'https://www.casabert.mx/api/checkout';
const STOREFRONT_API_URL = import.meta.env.VITE_STOREFRONT_API_URL || '';
const CHECKOUT_CC_EMAILS = ['david.aili.mx@gmail.com', 'casabert2026@gmail.com', 'benjaminsaksik9@gmail.com'];
const PROMO_LABELS_PER_GIFT = 10;
const PROMO_VOLUME_STEP = 10;
const PROMO_VOLUME_GIFT = 2;

const I18N_ES = { catalog: 'Catálogo por categorías', fixed: 'Precio fijo', loading: 'Cargando productos...' };

const emptyStorefront = {
  meta: { title: 'Casa Bert · Mini Shop' },
  hero: { text: 'Cargando catálogo real...' },
  location: {},
  catalog: []
};

const idFor = (category, name) => `${category}::${name}`.toLowerCase();

function normalizeKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function isGeneratedText(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return true;
  return (
    text.includes('selección destacada de') ||
    text.includes('descubre nuestra categoría') ||
    text.includes('a precio fijo casa bert') ||
    text.includes('ideal para disfrutar en cualquier momento')
  );
}

async function loadGithubImageMap() {
  const res = await fetch(GITHUB_PRODUCT_CONTENTS_API);
  if (!res.ok) throw new Error('No se pudo cargar imágenes desde GitHub contents API');
  const files = await res.json();
  const imageMap = {};

  (Array.isArray(files) ? files : [])
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(String(f?.name || '')) && f?.download_url)
    .forEach((file) => {
      const base = String(file.name).replace(/\.[^.]+$/, '');
      imageMap[normalizeKey(base)] = String(file.download_url);
    });

  return imageMap;
}

function mergeCatalogWithGithubImages(payload, imageMap) {
  const catalog = Array.isArray(payload?.catalog) ? payload.catalog : [];
  const mergedCatalog = catalog.map((category) => ({
    ...category,
    shortDescription: category.shortDescription || category.descriptionShort || category.descShort || '',
    longDescription: category.longDescription || category.descriptionLong || category.descLong || '',
    items: (category.items || []).map((item) => {
      const key = normalizeKey(item.name);
      const mappedUrl = imageMap[key] || '';
      const shortDescriptionRaw = item.shortDescription || item.descriptionShort || item.descShort || item.description || '';
      const longDescriptionRaw = item.longDescription || item.descriptionLong || item.descLong || item.description || '';
      return {
        ...item,
        fotoUrl: item.fotoUrl || mappedUrl || '',
        shortDescription: shortDescriptionRaw,
        longDescription: longDescriptionRaw
      };
    })
  }));

  return {
    ...payload,
    catalog: mergedCatalog
  };
}

function mergeLocationFallback(remotePayload, localPayload = {}) {
  const remoteLocation = remotePayload?.location || {};
  const localLocation = localPayload?.location || {};
  const pickPlaceId = (...values) => {
    for (const value of values) {
      const trimmed = String(value || '').trim();
      if (trimmed) return trimmed;
    }
    return '';
  };

  return {
    ...remotePayload,
    location: {
      ...remoteLocation,
      placeId: pickPlaceId(localLocation.placeId, localLocation.place_id, remoteLocation.placeId, remoteLocation.place_id)
    }
  };
}

async function loadStorefront() {
  const imageMap = await loadGithubImageMap();
  if (STOREFRONT_API_URL) {
    try {
      const res = await fetch(STOREFRONT_API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      const mergedPayload = mergeLocationFallback(payload, storefrontLocal);
      return mergeCatalogWithGithubImages(mergedPayload, imageMap);
    } catch {
      // fallback to local storefront below
    }
  }

  const mergedPayload = mergeLocationFallback(storefrontLocal, storefrontLocal);
  return mergeCatalogWithGithubImages(mergedPayload, imageMap);
}

export default function App() {
  const [storefront, setStorefront] = useState(emptyStorefront);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [cart, setCart] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [telegramContext, setTelegramContext] = useState(null);
  const [promoIndex, setPromoIndex] = useState(0);
  const [promoTouchStartX, setPromoTouchStartX] = useState(null);
  const promoTitleClamp = {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  };

  const promoCards = useMemo(
    () => [
      {
        key: 'promo1',
        title: 'Recompensamos tu lealtad',
        text: 'Por cada producto comprado te llevas una etiqueta CASABERT. Regresa con 10 etiquetas y tú eliges tu producto de regalo para celebrar contigo 🎉',
        footer: 'Promo activa',
        tone: 'emerald'
      },
      {
        key: 'promo2',
        title: 'TODO A $15',
        text: 'MERCADITO ECONÓMICO',
        footer: 'Precio ultra competitivo',
        tone: 'red'
      },
      {
        key: 'promo3',
        title: 'Condiciones de mayoreo a partir de 10 productos!',
        text: '¡Aún más! Si te llevas 10 productos en una sola compra, te regalamos 2 al instante. Si te llevas 20, te regalamos 4… ¡y así sucesivamente! 🚀',
        footer: 'Más compras, más regalos',
        tone: 'emerald'
      }
    ],
    []
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % promoCards.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [promoCards.length]);

  useEffect(() => {
    let active = true;
    loadStorefront()
      .then((data) => {
        if (!active) return;
        setStorefront(data);
        setLoadError('');
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err?.message || 'Error cargando catálogo remoto');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.title = storefront?.meta?.title || 'Casa Bert · Mini Shop';
  }, [storefront?.meta?.title]);

  useEffect(() => {
    const user = window?.Telegram?.WebApp?.initDataUnsafe?.user;
    if (user?.id) {
      setTelegramContext({
        id: user.id,
        username: user.username || '',
        firstName: user.first_name || '',
        lastName: user.last_name || ''
      });
    }
  }, []);

  const catalog = Array.isArray(storefront?.catalog) ? storefront.catalog : [];
  const categoryNames = useMemo(
    () => catalog.map((c) => c?.name).filter(Boolean),
    [catalog]
  );
  const selectedCategoryData = useMemo(() => {
    return catalog.find((c) => c.name === selectedCategory) || catalog[0] || null;
  }, [catalog, selectedCategory]);

  const mapsPhotos = Array.isArray(storefront?.location?.mapsPhotos)
    ? storefront.location.mapsPhotos
    : Array.isArray(storefront?.location?.photos)
      ? storefront.location.photos
      : [];
  const instagramPosts = Array.isArray(storefront?.location?.instagramPosts)
    ? storefront.location.instagramPosts
    : Array.isArray(storefront?.location?.instagramPhotos)
      ? storefront.location.instagramPhotos
      : [];
  const dict = I18N_ES;
  const catalogVersion = storefront?.meta?.version || 'live';
  const catalogUpdatedAt = storefront?.meta?.updatedAt || 'n/d';

  useEffect(() => {
    if (!categoryNames.length) {
      setSelectedCategory('');
      return;
    }
    if (!selectedCategory || !categoryNames.includes(selectedCategory)) {
      setSelectedCategory(categoryNames[0]);
    }
  }, [categoryNames, selectedCategory]);

  const cartSummary = useMemo(() => {
    const lines = Object.values(cart);
    const qty = lines.reduce((acc, l) => acc + l.qty, 0);
    const total = qty * FIXED_PRICE;
    return { lines, qty, total };
  }, [cart]);

  const promoSummary = useMemo(() => {
    const labelsEarnedRaw = cartSummary.qty % PROMO_LABELS_PER_GIFT;
    const labelsEarned = labelsEarnedRaw;
    const labelsToNextGift = labelsEarned === 0 ? PROMO_LABELS_PER_GIFT : PROMO_LABELS_PER_GIFT - labelsEarned;
    const volumeGiftQty = Math.floor(cartSummary.qty / PROMO_VOLUME_STEP) * PROMO_VOLUME_GIFT;
    return { labelsEarned, labelsToNextGift, volumeGiftQty };
  }, [cartSummary.qty]);

  const formatOrderMessage = (customer = {}) => {
    const linesText = cartSummary.lines
      .map((line) => `• ${line.name} x${line.qty}`)
      .join('\n');

    const customerBlock = [
      `Cliente: ${customer?.name || 'N/D'}`,
      `Teléfono: ${customer?.phone || 'N/D'}`,
      `Correo: ${customer?.email || 'N/D'}`,
      `Recoge: ${customer?.pickupDate || 'N/D'}`,
      `Horario: ${customer?.pickupSlot || 'N/D'}`,
      `Telegram ID: ${customer?.telegramUserId || 'N/D'}`
    ].join('\n');

    return [
      '🛒 NUEVO PEDIDO INTERNET · CASABERT',
      '',
      customerBlock,
      '',
      linesText || '(sin líneas)',
      '',
      `Productos: ${cartSummary.qty}`,
      `Total: $${cartSummary.total} MXN`,
      `Etiquetas ganadas: ${promoSummary.labelsEarned}`,
      `Regalos por volumen: ${promoSummary.volumeGiftQty}`
    ].join('\n');
  };

  const handleCheckout = async (customer = {}) => {
    if (!cartSummary.lines.length || checkoutLoading) return;
    setCheckoutLoading(true);

    try {
      const payload = {
        source: 'mini_app',
        totalQty: cartSummary.qty,
        totalAmount: cartSummary.total,
        currency: 'MXN',
        emailCc: CHECKOUT_CC_EMAILS,
        promo: promoSummary,
        customer,
        lines: cartSummary.lines,
        message: formatOrderMessage(customer)
      };

      const res = await fetch(CHECKOUT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const out = await res.json().catch(() => ({}));
      if (!res.ok || out?.ok === false) throw new Error(out?.error || 'No se pudo enviar el pedido');

      setToastMessage('✅ Pedido enviado. Confirmación enviada a Telegram y correo.');
      setToastVisible(true);
      setCart({});
      return { ok: true, out };
    } catch (err) {
      setToastMessage(`⚠️ Checkout no enviado: ${err?.message || 'error'}`);
      setToastVisible(true);
      return { ok: false, error: err?.message || 'error' };
    } finally {
      setCheckoutLoading(false);
      window.clearTimeout(window.__miniToastTimer);
      window.__miniToastTimer = window.setTimeout(() => setToastVisible(false), 2200);
    }
  };

  const addToCart = (category, item) => {
    const key = idFor(category, item.name || 'producto');
    setCart((prev) => ({
      ...prev,
      [key]: {
        key,
        name: item.name,
        category,
        qty: (prev[key]?.qty || 0) + 1
      }
    }));

    setToastMessage(`✅ ${item.name} agregado al carrito`);
    setToastVisible(true);
    window.clearTimeout(window.__miniToastTimer);
    window.__miniToastTimer = window.setTimeout(() => setToastVisible(false), 1400);
  };

  const updateLineQty = (key, delta) => {
    setCart((prev) => {
      const current = prev[key];
      if (!current) return prev;
      const nextQty = current.qty + delta;
      if (nextQty <= 0) {
        const { [key]: _removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [key]: {
          ...current,
          qty: nextQty
        }
      };
    });
  };

  const onPromoTouchStart = (e) => {
    setPromoTouchStartX(e.touches?.[0]?.clientX ?? null);
  };

  const onPromoTouchEnd = (e) => {
    if (promoTouchStartX == null) return;
    const endX = e.changedTouches?.[0]?.clientX ?? promoTouchStartX;
    const delta = endX - promoTouchStartX;
    if (Math.abs(delta) < 30) return;
    if (delta < 0) {
      setPromoIndex((prev) => (prev + 1) % promoCards.length);
    } else {
      setPromoIndex((prev) => (prev - 1 + promoCards.length) % promoCards.length);
    }
    setPromoTouchStartX(null);
  };

  return (
    <div className="min-h-screen bg-emerald-50 text-emerald-950">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 md:px-6">
        <HeroSection hero={storefront?.hero || emptyStorefront.hero} />

        <section>
          <div className="md:hidden">
            <div className="overflow-hidden rounded-2xl" onTouchStart={onPromoTouchStart} onTouchEnd={onPromoTouchEnd}>
              <div
                className="flex transition-transform duration-500"
                style={{ transform: `translateX(-${promoIndex * 100}%)` }}
              >
                {promoCards.map((promo) => (
                  <article
                    key={promo.key}
                    className={`relative aspect-square w-full shrink-0 overflow-hidden p-4 text-center shadow-md ${
                      promo.tone === 'red'
                        ? 'border-4 border-red-500 bg-gradient-to-br from-red-700 via-red-500 to-rose-400 ring-2 ring-red-300/70'
                        : 'border-2 border-emerald-200 bg-gradient-to-br from-emerald-900 via-emerald-700 to-emerald-500'
                    }`}
                  >
                    <img
                      src={promoBg}
                      alt={`Ilustración ${promo.key}`}
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10 mix-blend-screen"
                    />
                    <div className="relative z-10 flex h-full flex-col text-center">
                      <header className="text-xs font-black uppercase tracking-[0.14em] text-emerald-100">{promo.key.toUpperCase()}</header>
                      <div className="flex flex-1 flex-col items-center justify-center">
                        <h4 className={`font-black text-white ${promo.tone === 'red' ? 'text-4xl' : 'text-xl'}`} style={promoTitleClamp} title={promo.title}>
                          {promo.title}
                        </h4>
                        {promo.text ? <p className="mt-2 text-base font-semibold leading-snug text-emerald-50">{promo.text}</p> : null}
                      </div>
                      <footer className="text-[11px] font-black uppercase tracking-wide text-emerald-100">{promo.footer}</footer>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="mt-2 flex justify-center gap-1">
              {promoCards.map((promo, idx) => (
                <button
                  key={promo.key}
                  type="button"
                  onClick={() => setPromoIndex(idx)}
                  className={`h-2.5 w-2.5 rounded-full ${idx === promoIndex ? 'bg-emerald-700' : 'bg-emerald-300'}`}
                  aria-label={`Ir al slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="hidden gap-3 md:grid md:grid-cols-3">
            <article className="group relative aspect-square overflow-hidden rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-900 via-emerald-700 to-emerald-500 p-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <img
                src={promoBg}
                alt="Ilustración Promo 1"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10 mix-blend-screen transition-transform duration-500 group-hover:scale-110"
              />
              <div className="relative z-10 flex h-full flex-col text-center">
                <header className="text-xs font-black uppercase tracking-[0.14em] text-emerald-100">Promo 1</header>
                <div className="flex flex-1 flex-col items-center justify-center">
                  <h4 className="text-xl font-black leading-tight text-white" style={promoTitleClamp} title="Recompensamos tu lealtad">Recompensamos tu lealtad</h4>
                  <p className="mt-2 text-base font-semibold leading-snug text-emerald-50">
                    Por cada producto comprado te llevas una etiqueta CASABERT. Regresa con 10 etiquetas y tú eliges tu producto de regalo para celebrar contigo 🎉
                  </p>
                </div>
                <footer className="text-[11px] font-black uppercase tracking-wide text-emerald-100">Promo activa</footer>
              </div>
            </article>

            <article className="group relative aspect-square overflow-hidden rounded-2xl border-4 border-red-500 bg-gradient-to-br from-red-700 via-red-500 to-rose-400 p-4 shadow-xl ring-2 ring-red-300/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <img
                src={promoBg}
                alt="Ilustración TODO A $15"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10 mix-blend-screen transition-transform duration-500 group-hover:scale-110"
              />
              <div className="relative z-10 flex h-full flex-col text-center">
                <header className="text-xs font-black uppercase tracking-[0.2em] text-red-100">Oferta única</header>
                <div className="flex flex-1 flex-col items-center justify-center">
                  <h4 className="text-4xl font-black leading-none text-white md:text-5xl">TODO A $15</h4>
                  <p className="mt-3 text-sm font-extrabold uppercase tracking-[0.18em] text-rose-50">Mercadito económico</p>
                </div>
                <footer className="text-sm font-extrabold uppercase tracking-wide text-rose-50">Precio ultra competitivo</footer>
              </div>
            </article>

            <article className="group relative aspect-square overflow-hidden rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-900 via-emerald-700 to-emerald-500 p-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <img
                src={promoBg}
                alt="Ilustración Promo 2"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10 mix-blend-screen transition-transform duration-500 group-hover:scale-110"
              />
              <div className="relative z-10 flex h-full flex-col text-center">
                <header className="text-xs font-black uppercase tracking-[0.14em] text-emerald-100">Promo 2</header>
                <div className="flex flex-1 flex-col items-center justify-center">
                  <h4 className="text-xl font-black leading-tight text-white" style={promoTitleClamp} title="Condiciones de mayoreo a partir de 10 productos!">Condiciones de mayoreo a partir de 10 productos!</h4>
                  <p className="mt-2 text-base font-semibold leading-snug text-emerald-50">
                    ¡Aún más! Si te llevas 10 productos en una sola compra, te regalamos 2 al instante. Si te llevas 20, te regalamos 4… ¡y así sucesivamente! 🚀
                  </p>
                </div>
                <footer className="text-[11px] font-black uppercase tracking-wide text-emerald-100">Más compras, más regalos</footer>
              </div>
            </article>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-emerald-900">{dict.catalog} · Mercadito económico</h2>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
              {dict.fixed}: ${FIXED_PRICE}
            </span>
          </div>

          {loading ? <p className="text-sm text-emerald-700">{dict.loading}</p> : null}
          {loadError ? (
            <p className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {loadError}
            </p>
          ) : null}

          <CategoryFilterCloud
            categories={categoryNames}
            selectedCategory={selectedCategoryData?.name || ''}
            onSelect={setSelectedCategory}
          />

          {selectedCategoryData ? (
            <ProductCarousel
              key={selectedCategoryData.name}
              categoryName={selectedCategoryData.name}
              categoryShortDescription={selectedCategoryData.shortDescription}
              categoryLongDescription={selectedCategoryData.longDescription}
              items={selectedCategoryData.items || []}
              onAdd={addToCart}
              fixedPrice={FIXED_PRICE}
            />
          ) : null}
        </section>

        <GitProductGallery />

        <GoogleMapGalleryWidget
          location={{
            ...(storefront?.location || {}),
            placeId: String(
              storefrontLocal?.location?.placeId ||
                storefrontLocal?.location?.place_id ||
                storefront?.location?.placeId ||
                storefront?.location?.place_id ||
                ''
            ).trim()
          }}
        />
        <InstagramGalleryWidget
          items={instagramPosts}
          instagramUrl={storefront?.location?.instagram || DEFAULT_INSTAGRAM_URL}
        />

        <CartSummary
          summary={cartSummary}
          promo={promoSummary}
          onCheckout={handleCheckout}
          checkoutLoading={checkoutLoading}
          onQtyChange={updateLineQty}
          telegramContext={telegramContext}
        />

        <section className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm md:p-5">
          <h3 className="text-lg font-bold text-emerald-900">Visítanos</h3>
          <p className="mt-1 text-sm font-semibold text-emerald-800">{storefront?.location?.name || ''}</p>
          <p className="text-sm text-emerald-700">{storefront?.location?.address || ''}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              className="rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-900"
              href={storefront?.location?.mapUrl || '#'}
              target="_blank"
              rel="noreferrer"
            >
              Google Maps
            </a>
            <a
              className="rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-900"
              href={storefront?.location?.instagram || DEFAULT_INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>
          </div>
        </section>

        <footer className="rounded-2xl border border-emerald-200 bg-white/90 p-4 text-center text-xs text-emerald-800 shadow-sm">
          <p className="font-semibold">Powered by ailidmx · david.aili.mx@gmail.com</p>
          <p className="mt-1">Build: {BUILD_DATE} · Version: v{APP_VERSION}</p>
          <p className="mt-1">Catálogo: v{catalogVersion} · {catalogUpdatedAt}</p>
        </footer>
      </main>

      <ToastNotice message={toastMessage} visible={toastVisible} />
    </div>
  );
}