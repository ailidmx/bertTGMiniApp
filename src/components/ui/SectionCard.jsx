import React from 'react';

export default function SectionCard({ title, right, children }) {
  return (
    <section className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm md:p-5">
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title ? <h2 className="text-xl font-bold text-emerald-900">{title}</h2> : <span />}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
