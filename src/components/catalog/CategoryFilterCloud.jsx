import React from 'react';

export default function CategoryFilterCloud({ categories, selectedCategory, onSelect }) {
  if (!categories?.length) return null;

  return (
    <div className="mb-4">
      <p className="mb-2 text-sm font-semibold text-emerald-800">Filtrar por categoría</p>
      <div className="flex flex-wrap gap-2.5">
        {categories.map((category) => {
          const active = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelect(category)}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition-all duration-200 ${
                active
                  ? 'scale-[1.02] border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-300/60'
                  : 'border-emerald-300 bg-white text-emerald-900 hover:-translate-y-0.5 hover:border-emerald-500 hover:bg-emerald-50'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}
