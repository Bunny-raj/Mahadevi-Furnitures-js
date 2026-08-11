# MAHADEVI FURNITURES — PRD

## Original Problem Statement
"build me a very good website for my furniture businesses name of the shop is MAHADEVI FURNITURES and i can place the order which it should directly receive to my whatsapp number and i can rename the prices and also i can only update the data which everyone can see and make order for themsleves i have the logo if u can attach is also fine"

## User Choices (confirmed)
- WhatsApp for orders: +91 9949700111 (wa.me/919949700111)
- Admin auth: email + password (JWT, httpOnly cookies)
- Catalogue: sofas, beds, wardrobes, dining tables, dressing tables, plastic chairs, computer/laptop/office tables, recliners, home needs
- Design: modern & minimal + warm & premium, award-level motion (framer-motion + lenis)
- Reviews: customers submit from website, admin approves before they appear (2026-06 choice)
- Colours: admin defines per-product colours; customer picks one in order dialog → included in WhatsApp message
- Order statuses: pending / confirmed / delivered / cancelled
- Reviews shown on home page "Happy Customers" section

## Architecture
- FastAPI backend (/api prefix, port 8001): auth (JWT cookies, bcrypt, email-keyed brute-force lockout), products CRUD (colors[], sold_out), orders (create → wa.me link with colour; admin list + status update), reviews (public submit + upload, admin moderate), settings, object storage uploads (magic-byte validated)
- MongoDB: users, products, orders, reviews, settings, files, login_attempts
- React frontend: Home (hero, marquee, featured, Happy Customers reviews, showroom), Catalogue, Product Detail (colour swatches, sold-out state, order dialog), Admin Dashboard (Products / Orders / Reviews / Shop Settings tabs)

## Implemented (2026-08-09)
- Full public site, catalogue with filters/search, 12 seeded products
- WhatsApp order flow (dialog → DB → wa.me deep link)
- Admin: JWT login, product CRUD, featured toggle, orders list

## Implemented (2026-08-11 a)
- Discounts (MRP vs price, % off badges), photo uploads (Emergent object storage), logo upload, showroom section (address/hours/map in Shop Settings)

## Implemented (2026-08-11 b — this session)
- Customer Reviews: public submit (name, star rating, text, optional photo via public /api/reviews/upload), admin Reviews tab (approve/hide/delete), home page "Happy Customers" section shows approved only; 3 sample reviews seeded
- Order Status Tracking: admin Orders tab status dropdown (pending/confirmed/delivered/cancelled), colour shown per order; new orders default to pending
- Sold-Out Badges: admin product form "Mark as Sold Out" switch → dark badge + grayscale on cards, sold-out notice + WhatsApp enquiry link replaces order button on detail page
- Colour Palette: admin "Available Colours" comma-separated input; swatch pills on product detail + order dialog (required when product has colours); colour included in saved order + WhatsApp message; all 12 products seeded with category colours
- Fixes from testing: settings form now hydrates from GET /api/settings (data-loss bug), lockout keyed on email (proxy IP unreliable), review approve uses Pydantic bool, image uploads validate magic bytes, product form dialog a11y

## Implemented (2026-08-11 c)
- Review Reply: PUT /api/reviews/{id}/reply (admin), reply button + dialog in admin Reviews tab, "Reply from Mahadevi Furnitures" block shown under review on home page; empty reply removes it
- Real shop details set live: address (Shop No. 22-96, Beside Bajaj Electronics, BHEL X Road, Kanukunta, Lingampally, Hyderabad 502032), hours (Open all days: 10 AM – 9:30 PM), Google Maps embed (resolved from owner's share link, pin at MAHADEVI FURNITURES), real logo uploaded (square-cropped emblem)
- Navbar + footer show circular logo emblem beside the MAHADEVI wordmark
- Second contact number +91 93933 00111 added to footer "Talk To Us" (2026-08-11); WhatsApp orders still go to +91 99497 00111

## Implemented (2026-08-11 d)
- Categories updated: "Chairs" → "Plastic Chairs"; new "Tea Tables" and "Mattresses" categories
- New products: Rainbow Stackable Plastic Chairs, Classic Teak Tea Table, Glass-Top Tea Table, Relaxwell Ortho Plus Mattress (featured); old plastic chairs photo replaced with AI-generated set-of-4 image
- Relaxwell Mattresses home page banner ("Top in our industry.") with CTA → /catalogue?category=Mattresses; seed data updated for fresh deploys

## Implemented (2026-08-11 e)
- Mattress ordering options (per attached Relaxwell chart): Collection (Natural Elements/Elevate/Iconic/Dynamic/Orthopedic), Material (Coir/Spring/Foam/Natural Latex/Memory Foam), Firmness (Extra Firm/Medium Firm/Soft), Size (Single/Double/Queen/King) — required pill selectors in order dialog for category "Mattresses"; all selections stored on order + included in WhatsApp message; admin Orders tab shows them under product name
- OrderIn.options dict field; constants in /app/frontend/src/constants/mattressOptions.js

## Key endpoints (new)
- POST /api/reviews (public), GET /api/reviews (approved), GET /api/reviews/all (admin), PUT /api/reviews/{id}/approve, DELETE /api/reviews/{id}, POST /api/reviews/upload (public, 5MB)
- PUT /api/orders/{id}/status (admin)

## Testing
- iteration_1 + iteration_2 test reports in /app/test_reports/; final backend 94→100% after review-upload fix (self-verified via curl: spoofed image 400, real image 201)
- Test suite: /app/backend/tests/backend_test.py

## Backlog
- P1: Editable marquee/offer text from Shop Settings
- P2: Delete uploaded files (soft-delete exists in DB)
- P2: Split AdminDashboard.js into per-tab components
- P2: Move WhatsApp number to env/settings for frontend (currently hardcoded in App.js/ProductDetail.js)
