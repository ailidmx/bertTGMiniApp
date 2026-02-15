import React from 'react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const DEFAULT_LOCATION_NAME = 'Casa Bert';
const DEFAULT_LOCATION_ADDRESS = 'Epigmenio González 1106, Mexicaltzingo, Guadalajara';

function loadGoogleMapsApi() {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) return resolve(window.google.maps);
    const existing = document.getElementById('gmaps-script');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google.maps));
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar Google Maps API')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'gmaps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error('No se pudo cargar Google Maps API'));
    document.head.appendChild(script);
  });
}

export default function GoogleMapGalleryWidget({ location }) {
  const mapNodeRef = React.useRef(null);
  const [photos, setPhotos] = React.useState([]);
  const [current, setCurrent] = React.useState(0);
  const [loadError, setLoadError] = React.useState('');
  const locationName = String(location?.name || DEFAULT_LOCATION_NAME).trim();
  const locationAddress = String(location?.address || DEFAULT_LOCATION_ADDRESS).trim();

  React.useEffect(() => {
    let active = true;

    async function init() {
      if (!GOOGLE_MAPS_API_KEY) {
        setLoadError('Google Places no configurado (falta VITE_GOOGLE_MAPS_API_KEY). Modo mapa básico activo.');
        return;
      }

      try {
        const maps = await loadGoogleMapsApi();
        if (!active || !mapNodeRef.current) return;

        const map = new maps.Map(mapNodeRef.current, {
          center: { lat: 20.6597, lng: -103.3496 },
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });

        const service = new maps.places.PlacesService(map);
        const directPlaceId = String(location?.placeId || location?.place_id || '').trim();

        const loadPlaceDetails = (placeId) => {
          service.getDetails(
            {
              placeId,
              fields: ['place_id', 'photos', 'name', 'url', 'geometry']
            },
            (detail, detailStatus) => {
              if (!active) return;
              if (detailStatus !== maps.places.PlacesServiceStatus.OK) {
                setLoadError('No se pudieron cargar datos/fotos de Google Places.');
                return;
              }

              if (detail?.geometry?.location) {
                map.setCenter(detail.geometry.location);
                new maps.Marker({
                  map,
                  position: detail.geometry.location,
                  title: detail?.name || location?.name || 'Casa Bert'
                });
              }

              const list = (detail?.photos || []).slice(0, 12).map((p, idx) => ({
                id: `${detail?.place_id || placeId || 'place'}-${idx}`,
                url: p.getUrl({ maxWidth: 1200, maxHeight: 1200 }),
                attributions: Array.isArray(p.authorAttributions) ? p.authorAttributions : []
              }));

              setPhotos(list);
            }
          );
        };

        if (directPlaceId) {
          loadPlaceDetails(directPlaceId);
          return;
        }

        const query = [location?.name, location?.address].filter(Boolean).join(' ');
        service.findPlaceFromQuery(
          {
            query,
            fields: ['place_id', 'name', 'geometry']
          },
          (results, status) => {
            if (!active) return;
            if (status !== maps.places.PlacesServiceStatus.OK || !results?.[0]?.place_id) {
              setLoadError('No se pudo encontrar el lugar en Google Places. Agrega location.placeId para búsqueda directa.');
              return;
            }

            loadPlaceDetails(results[0].place_id);
          }
        );
      } catch (err) {
        if (!active) return;
        setLoadError(err?.message || 'No se pudo inicializar Google Maps');
      }
    }

    init();
    return () => {
      active = false;
    };
  }, [location?.address, location?.name, location?.placeId, location?.place_id]);

  React.useEffect(() => {
    if (photos.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % photos.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [photos.length]);

  return (
    <section className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm md:p-5">
      <h3 className="text-lg font-bold text-emerald-900">📍 Visítanos · Ubicación y fotos del local</h3>
      <p className="mt-1 text-sm font-semibold text-emerald-800">{locationName}</p>
      <p className="text-sm text-emerald-700">{locationAddress}</p>
      {loadError ? <p className="mt-2 text-sm font-semibold text-red-700">{loadError}</p> : null}

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {GOOGLE_MAPS_API_KEY ? (
          <div ref={mapNodeRef} className="h-72 w-full overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50" />
        ) : (
          <iframe
            title="Mapa Casa Bert"
            className="h-72 w-full overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50"
            src={`https://www.google.com/maps?q=${encodeURIComponent([locationName, locationAddress].filter(Boolean).join(' '))}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2">
          {GOOGLE_MAPS_API_KEY && photos.length ? (
            <>
              <img
                src={photos[current]?.url}
                alt="Foto de Google Places"
                className="h-64 w-full rounded-lg object-cover"
                loading="lazy"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {photos.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`h-2.5 w-2.5 rounded-full ${idx === current ? 'bg-emerald-700' : 'bg-emerald-300'}`}
                    onClick={() => setCurrent(idx)}
                    aria-label={`Ver foto ${idx + 1}`}
                  />
                ))}
              </div>

              <div className="mt-2 text-[11px] text-emerald-800">
                {(photos[current]?.attributions || []).map((a, idx) => (
                  <span key={idx} className="mr-2 inline-block">
                    ©{' '}
                    <a href={a.uri || '#'} target="_blank" rel="noreferrer" className="underline">
                      {a.displayName || 'Autor'}
                    </a>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="p-2 text-sm text-emerald-700">
              {GOOGLE_MAPS_API_KEY ? 'Cargando galería de Google Places...' : 'Configura la API key para activar fotos y autores de Google Places.'}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
