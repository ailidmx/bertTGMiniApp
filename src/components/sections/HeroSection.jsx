import React from 'react';
import logoFallback from '../../assets/LOGO.jpg';

export default function HeroSection({ hero }) {
  return (
    <header className="relative rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-700 to-emerald-500 p-6 pt-24 text-white shadow-lg">
      <img
        src={logoFallback}
        alt="Casa Bert"
        className="absolute left-4 top-4 h-14 w-14 rounded-xl border-2 border-white/50 object-cover md:left-6 md:top-6 md:h-16 md:w-16"
      />

      <div className="absolute left-1/2 top-4 -translate-x-1/2 text-center md:top-6">
        <h1 className="text-xl font-black uppercase tracking-[0.22em] md:text-3xl">CASABERT</h1>
      </div>

      <p className="mt-3 inline-block rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs font-bold tracking-wider">
        MINI APP E-COMMERCE
      </p>
      <h2 className="mt-2 text-2xl font-black md:text-4xl">Todo a $15 MXN</h2>
      <p className="mt-2 max-w-2xl text-sm text-emerald-50 md:text-base">{hero?.text}</p>
    </header>
  );
}
