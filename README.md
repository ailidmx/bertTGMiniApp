# BERT Telegram Mini App

Mini App Telegram (React + Vite + Tailwind) pilotée par un **JSON local** exporté depuis ton back-office (macro Apps Script).

## ✅ Nouvelle stratégie (sans CORS)

Le frontend lit maintenant les données depuis:

- `src/data/storefront.json`

Donc:

- pas de fetch cross-origin obligatoire
- pas de blocage CORS navigateur
- chargement ultra rapide

Le flux recommandé:

1. Macro Apps Script côté back-office exporte le catalogue en JSON
2. Tu remplaces `src/data/storefront.json` par ce JSON exporté
3. Build/deploy du front

## ✅ JSON attendu (`src/data/storefront.json`)

Structure minimale:

```json
{
  "meta": { "title": "Casa Bert · Mini Shop" },
  "hero": { "title": "...", "text": "..." },
  "location": {
    "name": "Casa Bert",
    "address": "...",
    "mapUrl": "https://maps...",
    "instagram": "https://instagram...",
    "mapsPhotos": [{ "url": "https://...", "alt": "..." }],
    "instagramPosts": [{ "url": "https://...", "alt": "..." }]
  },
  "catalog": [
    {
      "name": "Catégorie",
      "items": [
        { "name": "Produit", "description": "...", "price": 15, "fotoUrl": "https://..." }
      ]
    }
  ]
}
```

## 🧩 Structure Google Sheet recommandée (pour la macro d’export)

### 1) Sheet `GENERAL` (catalogue produits)
Colonnes minimum:

- `ARTICULO`
- `CATEGORIA`
- `FOTO_URL`
- `DESCRIPCION`
- `PRECIO` (optionnel si prix global)
- `ACTIVO` (`1`, `true`, `si`, `x`)
- `ORDEN` (nombre pour trier)

### 2) Sheet `SETTINGS` (contenu du site)
Format simple clé/valeur:

| key | value |
|---|---|
| SITE_TITLE | Casa Bert Mini App |
| SITE_SUBTITLE | Snacks artesanales |
| STOREFRONT_PRICE | 15 |
| HERO_BADGE | Mini App E-commerce |
| HERO_TITLE | Snacks saludables a solo $15 MXN |
| HERO_TEXT | Catálogo por categorías con carrito rápido |
| CTA_ADD_LABEL | Agregar |
| CART_EMPTY_TEXT | Tu carrito está vacío |
| CURRENCY | MXN |
| PRICING_LABEL | Precio único: $15 MXN |

Avec ça, la macro peut générer `storefront.json` directement pour le front.

## 🧪 Dev local

```bash
npm install
npm run dev
```

## 🔄 Actualizar `storefront.json` con catálogo real

El proyecto incluye un comando para traer el catálogo real (Apps Script) y escribirlo en:

- `src/data/storefront.json`

Ejecuta:

```bash
npm run refresh:storefront
```

Si falla con `Upstream HTTP 404`, el problema es del endpoint Apps Script (URL/deploy/permisos), no del frontend.

Opcional (si quieres consumir storefront remoto en runtime):

```env
VITE_STOREFRONT_API_URL=https://tu-dominio/api/storefront
```

## 🚀 Déploiement frontend statique

```bash
npm run build
```

Puis publier le front (GitHub Pages ou autre hébergeur statique).

## 🔗 BotFather (Mini App officielle)

1. `/setdomain` → `ailidmx.github.io`
2. `/setmenubutton` → Web App → URL :

```
https://ailidmx.github.io/bertTGMiniApp/
```

## Notes
- Si `mapsPhotos` ou `instagramPosts` est vide, les galeries correspondantes ne s’affichent pas.
- Pour avoir les vraies photos Insta/Maps, la macro doit remplir ces tableaux avec des URLs d’images publiques.