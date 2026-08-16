const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");
const pct = (p) => (p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0);
const WA = "https://wa.me/919949700111";

let all = [];
let category = "All";

async function init() {
  const [products, settings, reviews] = await Promise.all([
    fetch("/api/products").then((r) => r.json()),
    fetch("/api/settings").then((r) => r.json()),
    fetch("/api/reviews").then((r) => r.json()),
  ]);
  all = products;

  document.getElementById("nav-wa").href = WA + "?text=" + encodeURIComponent("Hello MAHADEVI FURNITURES! I have a question.");
  document.getElementById("footer-wa").href = document.getElementById("nav-wa").href;
  document.getElementById("footer-address").textContent = settings.address || "";
  document.getElementById("footer-hours").textContent = settings.hours || "";
  const offer = "Up to 60% Off on Selected Furniture — Order Directly on WhatsApp — Free Local Delivery — ";
  document.getElementById("marquee-text").textContent = offer.repeat(4);

  const cats = ["All", ...new Set(products.map((p) => p.category))];
  const filtersEl = document.getElementById("filters");
  filtersEl.innerHTML = cats.map((c) => `<button data-c="${c}" class="${c === "All" ? "active" : ""}">${c}</button>`).join("");
  filtersEl.addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") return;
    category = e.target.dataset.c;
    filtersEl.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === e.target));
    render();
  });
  document.getElementById("search").addEventListener("input", render);

  render();

  document.getElementById("rev-grid").innerHTML = reviews.slice(0, 6).map((r) => `
    <div class="rev">
      <div class="stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>
      <p>“${r.text}”</p>
      ${r.owner_reply ? `<div class="owner-reply"><small>Reply from Mahadevi Furnitures</small><br/>${r.owner_reply}</div>` : ""}
      <b>${r.name}</b>
    </div>`).join("");
}

function render() {
  const q = document.getElementById("search").value.toLowerCase();
  const items = all.filter((p) => (category === "All" || p.category === category) && p.name.toLowerCase().includes(q));
  document.getElementById("grid").innerHTML = items.map((p) => `
    <a class="card" href="/product.html?id=${p.id}">
      <div class="imgbox">
        ${p.sold_out ? `<span class="badge sold">Sold Out</span>` : pct(p) > 0 ? `<span class="badge">${pct(p)}% Off</span>` : ""}
        <img src="${p.image_url}" alt="${p.name}" loading="lazy" class="${p.sold_out ? "soldout" : ""}" />
      </div>
      <div class="cat">${p.category}</div>
      <h3>${p.name}</h3>
      <div style="margin-top:6px"><span class="price">${inr(p.price)}</span>${p.mrp > p.price ? `<span class="mrp">${inr(p.mrp)}</span>` : ""}</div>
    </a>`).join("") || `<p style="color:var(--muted)">No products found.</p>`;
}

init();
