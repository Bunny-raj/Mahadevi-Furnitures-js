# MAHADEVI FURNITURES — PRD

## Original Problem Statement
"build me a very good website for my furniture businesses name of the shop is MAHADEVI FURNITURES and i can place the order which it should directly receive to my whatsapp number and i can rename the prices and also i can only update the data which everyone can see and make order for themsleves i have the logo if u can attach is also fine"

## User Choices (confirmed)
- WhatsApp for orders: +91 9949700111 (wa.me/919949700111)
- Admin auth: email + password (JWT, httpOnly cookies)
- Logo: text-based "MAHADEVI FURNITURES" (no image file provided)
- Catalogue: sofas, beds, wardrobes, dining tables, dressing tables, plastic chairs, computer/laptop/office tables, recliners, home needs
- Design: modern & minimal + warm & premium, award-level motion (framer-motion + lenis)

## User Personas
- Customer: browses catalogue, filters by category, orders via WhatsApp without signup
- Shop owner (admin): logs in, edits prices/products, adds/deletes products, sees orders

## Architecture
- FastAPI backend (/api prefix, port 8001): auth (JWT cookies, bcrypt, brute-force lockout), products CRUD (public read, admin write), orders (public create → wa.me link, admin list), startup seeding (admin + 12 products)
- MongoDB via MONGO_URL/DB_NAME: users, products, orders, login_attempts
- React frontend (port 3000): Home (kinetic hero, marquee, manifesto, featured), Catalogue (filters + search), Product Detail (sticky gallery + WhatsApp order dialog), Admin Login, Admin Dashboard (products table + orders table)
- Design: Playfair Display + Outfit, warm sand/charcoal/mahogany palette, lenis smooth scroll, framer-motion reveals

## Implemented (2026-08-09)
- Full public site with hero animation, editorial marquee, manifesto chapters, featured products
- Catalogue with 9 category filters + live search, 12 seeded products with real photography
- WhatsApp order flow: dialog (name/phone/qty/address) → order saved in DB → wa.me deep link opens with prefilled message
- Admin: JWT login, product add/edit/delete (price rename live instantly), featured toggle, orders list, logout
- Floating WhatsApp button, glass navbar, dark footer with phone/WhatsApp links

## Implemented (2026-08-11)
- Discounts up to 60%: per-product MRP field in admin; storefront shows "% Off" badges, strikethrough MRP and "You save ₹X"; marquee includes UP TO 60% OFF; existing products migrated with MRPs (20–60% off)
- Photo uploads from phone/desktop: admin product form has Upload button (Emergent object storage via /api/upload, served at /api/files/*); admin-only, 8MB image limit
- Logo upload: admin Shop Settings tab → logo shows in navbar + footer (text wordmark fallback)
- Showroom section on home page: address, business hours, Google Maps embed — all editable in admin Shop Settings; address/hours also appear in footer

## Backlog
- P0: none
- P1: Owner fills real showroom address, hours, map link and uploads real logo in Shop Settings
- P2: Mark orders as done/pending in admin
- P2: Product stock status (available/sold out)
- P2: Delete uploaded files (soft-delete exists in DB)
