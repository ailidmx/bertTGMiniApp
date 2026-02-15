import React from 'react';
import SectionCard from '../ui/SectionCard';

export default function InstagramGalleryWidget({ items = [], instagramUrl = 'https://www.instagram.com/casa_bert/?hl=en' }) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (items.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [items.length]);

  if (!items.length) {
    return (
      <SectionCard title="Instagram · Feed" right={<span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">0 fotos</span>}>
        <p className="text-sm text-emerald-700">Sin fotos en feed local todavía.</p>
        <a
          href={instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-900"
        >
          Abrir Instagram
        </a>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Instagram · Feed"
      right={<span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">{items.length} fotos</span>}
    >
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 p-2">
          <img
            src={items[index]?.url}
            alt={items[index]?.alt || 'Instagram photo'}
            className="h-72 w-full rounded-lg object-cover"
            loading="lazy"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 md:grid-cols-2">
          {items.slice(0, 6).map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              className={`overflow-hidden rounded-lg border ${i === index ? 'border-emerald-600 ring-2 ring-emerald-300' : 'border-emerald-200'}`}
            >
              <img src={img.url} alt={img.alt || 'Instagram thumb'} className="h-20 w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      </div>

      <a
        href={instagramUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-block rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-900"
      >
        Ver cuenta completa en Instagram
      </a>
    </SectionCard>
  );
}
