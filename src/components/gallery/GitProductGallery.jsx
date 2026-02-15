import React, { useEffect, useMemo, useState } from 'react';
import SectionCard from '../ui/SectionCard';

const GITHUB_CONTENTS_API = 'https://api.github.com/repos/ailidmx/BertClient/contents/img/product';
const isImageFile = (name = '') => /\.(png|jpe?g|webp)$/i.test(name);

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function GitProductGallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(4);

  useEffect(() => {
    let active = true;

    fetch(GITHUB_CONTENTS_API)
      .then((res) => res.json())
      .then((items) => {
        if (!active) return;
        const mapped = Array.isArray(items)
          ? items
              .filter((item) => isImageFile(item?.name) && item?.download_url)
              .map((item) => ({
                name: item.name,
                url: item.download_url
              }))
          : [];

        setImages(shuffle(mapped));
        setIndex(0);
      })
      .catch(() => {
        if (active) setImages([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const updateSlides = () => {
      const w = window.innerWidth;
      if (w < 640) setSlidesPerView(1);
      else if (w < 900) setSlidesPerView(2);
      else setSlidesPerView(4);
    };

    updateSlides();
    window.addEventListener('resize', updateSlides);
    return () => window.removeEventListener('resize', updateSlides);
  }, []);

  const maxIndex = useMemo(
    () => Math.max(images.length - slidesPerView, 0),
    [images.length, slidesPerView]
  );

  useEffect(() => {
    if (index > maxIndex) setIndex(0);
  }, [index, maxIndex]);

  useEffect(() => {
    if (images.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 2800);

    return () => clearInterval(timer);
  }, [images.length, maxIndex]);

  const next = () => {
    if (!images.length) return;
    setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prev = () => {
    if (!images.length) return;
    setIndex((prevIdx) => (prevIdx <= 0 ? maxIndex : prevIdx - 1));
  };

  const galleryLabel = useMemo(() => {
    if (loading) return 'Cargando galería...';
    if (!images.length) return 'No se pudo cargar la galería remota';
    return `${images.length} imágenes en orden aleatorio`;
  }, [images.length, loading]);

  return (
    <SectionCard
      title="✨ Siempre algo para tu antojo"
      right={<span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">{galleryLabel}</span>}
    >
      <div className="flex items-center gap-2 md:gap-3">
        <button
          type="button"
          onClick={prev}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-emerald-300 bg-emerald-100 text-lg font-bold text-emerald-900 hover:bg-emerald-200"
          aria-label="Imagen anterior"
        >
          ‹
        </button>

        <div className="relative flex-1 overflow-hidden rounded-xl">
          <div
            className="flex gap-3 transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(calc(-${index * (100 / slidesPerView)}% - ${index * 0.75}rem))` }}
          >
            {images.map((img) => (
              <figure
                key={img.url}
                className="overflow-hidden rounded-xl border border-emerald-200 bg-white"
                style={{ minWidth: `calc(${100 / slidesPerView}% - 0.6rem)` }}
              >
                <div className="aspect-square bg-emerald-50 p-1">
                  <img src={img.url} alt="Producto" loading="lazy" className="h-full w-full rounded-md object-contain" />
                </div>
              </figure>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={next}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-emerald-300 bg-emerald-100 text-lg font-bold text-emerald-900 hover:bg-emerald-200"
          aria-label="Imagen siguiente"
        >
          ›
        </button>
      </div>
    </SectionCard>
  );
}
