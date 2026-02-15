import React, { useEffect, useMemo, useState } from 'react';
import SectionCard from '../ui/SectionCard';

export default function SocialGallery({ title, items = [] }) {
  const [index, setIndex] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(4);

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
    () => Math.max(items.length - slidesPerView, 0),
    [items.length, slidesPerView]
  );

  useEffect(() => {
    if (items.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 3200);
    return () => clearInterval(timer);
  }, [items.length, maxIndex]);

  const next = () => setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  const prev = () => setIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));

  if (!items.length) return null;

  return (
    <SectionCard title={title} right={<span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">{items.length} fotos</span>}>
      <div className="flex items-center gap-2 md:gap-3">
        <button type="button" onClick={prev} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-emerald-300 bg-emerald-100 text-lg font-bold text-emerald-900 hover:bg-emerald-200">‹</button>

        <div className="relative flex-1 overflow-hidden rounded-xl">
          <div
            className="flex gap-3 transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(calc(-${index * (100 / slidesPerView)}% - ${index * 0.75}rem))` }}
          >
            {items.map((img, i) => (
              <figure
                key={`${img.url}-${i}`}
                className="overflow-hidden rounded-xl border border-emerald-200 bg-white"
                style={{ minWidth: `calc(${100 / slidesPerView}% - 0.6rem)` }}
              >
                <div className="aspect-square bg-emerald-50 p-1">
                  <img src={img.url} alt={img.alt || title} loading="lazy" className="h-full w-full rounded-md object-cover" />
                </div>
              </figure>
            ))}
          </div>
        </div>

        <button type="button" onClick={next} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-emerald-300 bg-emerald-100 text-lg font-bold text-emerald-900 hover:bg-emerald-200">›</button>
      </div>
    </SectionCard>
  );
}
