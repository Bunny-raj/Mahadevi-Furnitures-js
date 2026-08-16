const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const WHATSAPP_NUMBER = "919949700111";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Mahadevi@2026";

const DATA_DIR = path.join(__dirname, "..", "data");
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf8"));
const write = (f, d) => fs.writeFileSync(path.join(DATA_DIR, f), JSON.stringify(d, null, 1));
if (!fs.existsSync(path.join(DATA_DIR, "orders.json"))) write("orders.json", []);

app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "..", "images")));
app.use(express.static(path.join(__dirname, "..", "frontend")));

const tokens = new Set();
const auth = (req, res, next) => {
  const t = (req.headers.authorization || "").replace("Bearer ", "");
  if (!tokens.has(t)) return res.status(401).json({ error: "Not authorised" });
  next();
};

// ---------- public API ----------
app.get("/api/settings", (req, res) => res.json(read("settings.json")));

app.get("/api/products", (req, res) => {
  let items = read("products.json");
  if (req.query.category) items = items.filter((p) => p.category === req.query.category);
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    items = items.filter((p) => p.name.toLowerCase().includes(q));
  }
  res.json(items);
});

app.get("/api/products/:id", (req, res) => {
  const p = read("products.json").find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(p);
});

app.post("/api/orders", (req, res) => {
  const { product_name, quantity = 1, name, phone, address = "", color = "", options = {} } = req.body || {};
  if (!product_name || !name || !phone) return res.status(400).json({ error: "Missing fields" });
  const orders = read("orders.json");
  const order = { id: crypto.randomUUID(), product_name, quantity, name, phone, address, color, options, status: "pending", created_at: new Date().toISOString() };
  orders.unshift(order);
  write("orders.json", orders);
  const optLines = Object.entries(options).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}\n`).join("");
  const msg = `Hello MAHADEVI FURNITURES! I would like to place an order.\n\nProduct: ${product_name}\n${color ? `Colour: ${color}\n` : ""}${optLines}Quantity: ${quantity}\nName: ${name}\nPhone: ${phone}\nAddress: ${address || "-"}`;
  res.status(201).json({ ok: true, wa_link: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}` });
});

app.get("/api/reviews", (req, res) => res.json(read("reviews.json").filter((r) => r.approved)));

app.post("/api/reviews", (req, res) => {
  const { name, rating = 5, text, photo_url = "" } = req.body || {};
  if (!name || !text) return res.status(400).json({ error: "Name and review text are required" });
  const reviews = read("reviews.json");
  reviews.unshift({ id: crypto.randomUUID(), name, rating: Math.max(1, Math.min(5, rating)), text, photo_url, approved: false, created_at: new Date().toISOString() });
  write("reviews.json", reviews);
  res.status(201).json({ ok: true });
});

// ---------- admin API ----------
app.post("/api/admin/login", (req, res) => {
  if ((req.body || {}).password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Wrong password" });
  const t = crypto.randomBytes(24).toString("hex");
  tokens.add(t);
  res.json({ token: t });
});

app.put("/api/products/:id", auth, (req, res) => {
  const products = read("products.json");
  const i = products.findIndex((p) => p.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: "Not found" });
  const allowed = ["name", "price", "mrp", "description", "category", "colors", "sold_out", "featured"];
  for (const k of allowed) if (k in req.body) products[i][k] = req.body[k];
  write("products.json", products);
  res.json(products[i]);
});

app.get("/api/orders", auth, (req, res) => res.json(read("orders.json")));

app.get("/api/reviews/all", auth, (req, res) => res.json(read("reviews.json")));
app.put("/api/reviews/:id/approve", auth, (req, res) => {
  const reviews = read("reviews.json");
  const r = reviews.find((x) => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: "Not found" });
  r.approved = !!(req.body || {}).approved;
  write("reviews.json", reviews);
  res.json({ ok: true });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "..", "frontend", "index.html")));

app.listen(PORT, () => console.log(`MAHADEVI FURNITURES running → http://localhost:${PORT}`));
