# BERT Telegram Mini App

Mini App dédiée pour Telegram (React + Vite + GitHub Pages) qui consomme l’API Apps Script.

## ✅ API Apps Script (JSON)
Base URL (WebApp):

```
https://script.google.com/macros/s/AKfycbzGil_ExVCKOAUsJreds_mWscI9m35jlW7VSYxemS3edrLFWKjE6ResNxrBIWwhhYue6Q/exec
```

Endpoints :

- `?api=kpi`
- `?api=month`
- `?api=catalog`

## 🧪 Dev local

```bash
npm install
npm run dev
```

## 🚀 Déploiement GitHub Pages

```bash
npm run build
```

Puis activer **GitHub Pages** sur la branche `main` → dossier `/dist`.

## 🔗 BotFather (Mini App officielle)

1. `/setdomain` → `ailidmx.github.io`
2. `/setmenubutton` → Web App → URL :

```
https://ailidmx.github.io/bertTGMiniApp/
```

## Notes
- Mettre à jour `API_BASE` dans `src/App.jsx` si le WebApp Apps Script change.