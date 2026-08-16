# MAHADEVI FURNITURES — Offline Website (Node.js)

Complete website: Node.js backend + HTML/CSS/JS frontend + all product images and data.

## Folder structure
```
nodejs-site/
├── backend/     Node.js (Express) server + package.json
├── frontend/    HTML, CSS and JS files
├── images/      All product photos, logo, review photos
└── data/        products.json, reviews.json, settings.json, orders.json
```

## How to run (2 steps)
Requires Node.js 18+ (download from nodejs.org).

```bash
cd backend
npm install
npm start
```

Open http://localhost:3000 in your browser.

## Admin panel
- Open http://localhost:3000/admin.html
- Password: Mahadevi@2026
- Edit prices/MRP, view orders, approve reviews. Changes save to the data/ folder.

## WhatsApp orders
Orders open WhatsApp pre-filled to +91 99497 00111 (change WHATSAPP_NUMBER in backend/server.js).
