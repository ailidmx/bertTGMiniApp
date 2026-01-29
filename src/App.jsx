import React, { useEffect, useState } from 'react';

const API_BASE = 'https://script.google.com/macros/s/AKfycbzGil_ExVCKOAUsJreds_mWscI9m35jlW7VSYxemS3edrLFWKjE6ResNxrBIWwhhYue6Q/exec';
const API_TOKEN = 'BERT2026*';

function useApi(endpoint, initial) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const url = `${API_BASE}?api=${endpoint}&token=${encodeURIComponent(API_TOKEN)}`;
    console.log(`[MiniApp] fetch start ${endpoint}`, url);
    setLoading(true);
    fetch(url)
      .then((res) => {
        console.log(`[MiniApp] fetch status ${endpoint}`, res.status);
        return res.json();
      })
      .then((json) => {
        if (!active) return;
        console.log(`[MiniApp] fetch data ${endpoint}`, json);
        setData(json);
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        console.error(`[MiniApp] fetch error ${endpoint}`, err);
        setError(err.message || 'Error');
      })
      .finally(() => {
        if (!active) return;
        console.log(`[MiniApp] fetch done ${endpoint}`);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [endpoint]);

  return { data, loading, error };
}

export default function App() {
  const kpi = useApi('kpi', {});
  const month = useApi('month', {});
  const catalog = useApi('catalog', []);

  return (
    <div className="app">
      <header>
        <h1>BERT CRM Showcase</h1>
        <p>Mini App dedicada (API Apps Script)</p>
      </header>

      <section className="card">
        <h2>KPI del día</h2>
        {kpi.loading ? (
          <p>Cargando...</p>
        ) : kpi.error ? (
          <p className="error">{kpi.error}</p>
        ) : (
          <div className="grid">
            <div><span>Objetivo</span><strong>{kpi.data.goal}</strong></div>
            <div><span>Vendido</span><strong>{kpi.data.sold}</strong></div>
            <div><span>Falta</span><strong>{kpi.data.missing}</strong></div>
            <div><span>%</span><strong>{kpi.data.pct}%</strong></div>
            <div><span>Ventas caja</span><strong>{kpi.data.ventasCaja}</strong></div>
            <div><span>Canasta</span><strong>{kpi.data.canastaProm}</strong></div>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Estado mes</h2>
        {month.loading ? (
          <p>Cargando...</p>
        ) : month.error ? (
          <p className="error">{month.error}</p>
        ) : (
          <ul>
            <li><strong>{month.data.label}</strong></li>
            <li>Objetivo: {month.data.obj}</li>
            <li>Ventas caja: {month.data.ventasCaja}</li>
            <li>% mes: {month.data.pctMes || '--'}</li>
            <li>Gratis mes: {month.data.gratisMes}</li>
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Catálogo</h2>
        {catalog.loading ? (
          <p>Cargando...</p>
        ) : catalog.error ? (
          <p className="error">{catalog.error}</p>
        ) : (
          catalog.data.map((cat) => (
            <div key={cat.name} className="category">
              <h3>{cat.name}</h3>
              <div className="products">
                {cat.items.map((item) => (
                  <div key={item.name} className="product">
                    {item.fotoUrl ? <img src={item.fotoUrl} alt={item.name} /> : null}
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}