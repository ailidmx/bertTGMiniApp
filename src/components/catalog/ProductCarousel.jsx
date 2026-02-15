import React from 'react';

function ProductCard({ item, categoryName, onAdd, onOpenDetail, fixedPrice }) {
  const [addedFx, setAddedFx] = React.useState(false);
  const weightValue = item.weight || item.peso || item.size || item.presentation || '';
  const piecesValue = item.pieces || item.piezas || item.pieceCount || item.numeroPiezas || item.quantity || '';

  const formatMeasure = () => {
    if (weightValue && piecesValue) return `${weightValue} · ${piecesValue} pzas`;
    if (weightValue) return weightValue;
    if (piecesValue) return `${piecesValue} pzas`;
    return '';
  };
  const measureLabel = formatMeasure();
  const productTitleStyle = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };

  const handleAdd = () => {
    onAdd(categoryName, item);
    setAddedFx(true);
    window.setTimeout(() => setAddedFx(false), 320);
  };

  const openDetail = () => onOpenDetail(item);

  return (
    <article
      className={`group relative w-[240px] shrink-0 overflow-hidden rounded-xl border bg-white transition-all duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-emerald-400 ${
        addedFx
          ? 'border-emerald-400 shadow-[0_12px_28px_rgba(16,185,129,0.35)]'
          : 'border-emerald-200 hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[0_18px_40px_rgba(16,185,129,0.28)]'
      }`}
      onClick={openDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDetail();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {item.fotoUrl ? (
        <img src={item.fotoUrl} alt={item.name} className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
      ) : (
        <div className="grid aspect-square w-full place-items-center bg-emerald-100 font-bold text-emerald-700">Casa Bert</div>
      )}
      <div className="p-3">
        <div className="mb-1 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 opacity-70 transition-opacity group-hover:opacity-100">
          ↗ Ver ficha
        </div>
        <h4 className="min-h-10 text-sm font-bold text-emerald-900" style={productTitleStyle} title={item.name}>
          {item.name}
        </h4>
        {item.shortDescription ? <p className="mt-1 min-h-10 text-xs text-emerald-700">{item.shortDescription}</p> : null}
        {measureLabel ? <p className="mt-1 text-[11px] font-semibold text-emerald-700">Peso / piezas: {measureLabel}</p> : null}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-emerald-800">${item.price || fixedPrice} MXN</span>
          <button
            className={`rounded-md px-3 py-1.5 text-xs font-bold text-white transition-all duration-200 ${
              addedFx ? 'scale-105 bg-emerald-500' : 'bg-emerald-700 hover:bg-emerald-600 active:scale-95'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleAdd();
            }}
          >
            {addedFx ? '✓ Agregado' : 'Agregar'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function ProductCarousel({
  categoryName,
  categoryShortDescription,
  items,
  onAdd,
  fixedPrice
}) {
  const [detailItem, setDetailItem] = React.useState(null);

  return (
    <article>
      <h3 className="mb-2 text-base font-bold text-emerald-900">{categoryName}</h3>
      {categoryShortDescription ? <p className="text-sm font-semibold text-emerald-700">{categoryShortDescription}</p> : null}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map((item) => (
          <ProductCard
            key={`${categoryName}-${item.name}`}
            item={item}
            categoryName={categoryName}
            onAdd={onAdd}
            onOpenDetail={setDetailItem}
            fixedPrice={fixedPrice}
          />
        ))}
      </div>

      {detailItem ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setDetailItem(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-base font-black text-emerald-900">{detailItem.name}</h4>
            {detailItem.fotoUrl ? <img src={detailItem.fotoUrl} alt={detailItem.name} className="mt-2 aspect-square w-full rounded-xl object-cover" /> : null}
            {detailItem.longDescription ? <p className="mt-3 text-sm text-emerald-800">{detailItem.longDescription}</p> : null}
            <div className="mt-3 flex justify-end">
              <button className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white" onClick={() => setDetailItem(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
