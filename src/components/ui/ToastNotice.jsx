import React from 'react';

export default function ToastNotice({ message, visible }) {
  return (
    <div
      className={`pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-emerald-300 bg-white/95 px-4 py-2 text-sm font-semibold text-emerald-900 shadow-lg backdrop-blur transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
