import React, { useEffect, useMemo, useState } from 'react';
import HeroSection from './components/sections/HeroSection';
import ProductCarousel from './components/catalog/ProductCarousel';
import CategoryFilterCloud from './components/catalog/CategoryFilterCloud';
import CartSummary from './components/cart/CartSummary';
import GitProductGallery from './components/gallery/GitProductGallery';
import SocialGallery from './components/gallery/SocialGallery';
import ToastNotice from './components/ui/ToastNotice';

const FIXED_PRICE = 15;
const APP_VERSION = '1.0.0';
const BUILD_DATE = '2026-02-14 19:27 (MX)';
const DEFAULT_INSTAGRAM_URL = 'https://www.instagram.com/casa_bert/?hl=en';
const STOREFRONT_REMOTE_URL =
  'https://raw.githubusercontent.com/ailidmx/bertTGMiniApp/main/src/data/storefront.json';
const GITHUB_PRODUCT_CONTENTS_API = 'https://api.github.com/repos/ailidmx/BertClient/contents/img/product';

const I18N = {
  es: { catalog: 'Catálogo por categorías', fixed: 'Precio fijo', loading: 'Cargando productos...' },
  fr: { catalog: 'Catalogue par catégories', fixed: 'Prix fixe', loading: 'Chargement des produits...' },
  en: { catalog: 'Catalog by categories', fixed: 'Fixed price', loading: 'Loading products...' }
};

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
    items: (category.items || []).map((item) => {
      const key = normalizeKey(item.name);
      const mappedUrl = imageMap[key] || '';
      return {
        ...item,
        fotoUrl: item.fotoUrl || mappedUrl || ''
      };
    })
  }));

  return {
    ...payload,
    catalog: mergedCatalog
  };
}

async function loadStorefront() {
  const [storefrontRes, imageMap] = await Promise.all([
    fetch(STOREFRONT_REMOTE_URL),
    loadGithubImageMap()
  ]);

  if (!storefrontRes.ok) throw new Error('No se pudo cargar storefront JSON remoto');
  const storefront = await storefrontRes.json();
  return mergeCatalogWithGithubImages(storefront, imageMap);
}

export default function App() {
  const [storefront, setStorefront] = useState(emptyStorefront);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [cart, setCart] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lang, setLang] = useState('es');
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

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
  const dict = I18N[lang] || I18N.es;
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

  return (
    <div className="min-h-screen bg-emerald-50 text-emerald-950">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 md:px-6">
        <HeroSection hero={storefront?.hero || emptyStorefront.hero} lang={lang} setLang={setLang} />

        <section className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-emerald-900">{dict.catalog}</h2>
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
              items={selectedCategoryData.items || []}
              onAdd={addToCart}
              fixedPrice={FIXED_PRICE}
            />
          ) : null}
        </section>

        <GitProductGallery />

        <SocialGallery title="Galería Google Maps" items={mapsPhotos} />
        <SocialGallery title="Galería Instagram" items={instagramPosts} />

        <CartSummary summary={cartSummary} />

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