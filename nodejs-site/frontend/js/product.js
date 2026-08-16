const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");
const COLORS = { "walnut brown": "#5D4037", "brown": "#795548", "dark brown": "#4E342E", "teak": "#8B5A2B", "beige": "#D9C9BA", "cream": "#F3EAD9", "ivory": "#F6F1E7", "white": "#FAFAFA", "grey": "#8D8D8D", "gray": "#8D8D8D", "dark grey": "#4A4A4A", "charcoal": "#36322F", "black": "#1A1817", "blue": "#3F5F8A", "navy blue": "#27394F", "green": "#4F6F52", "olive": "#6B6B3A", "red": "#A63A3A", "yellow": "#D9B23D", "orange": "#C9722E", "pink": "#C98A9A", "gold": "#C9A227", "honey": "#B8860B", "teal": "#2E7F7F", "charcoal grey": "#3E3A37", "pearl white": "#F2EEE6", "dark beige": "#B8A07E", "rust brown": "#8B4A2F", "bright red & black": "#A63A3A", "light green": "#9CBF8E", "aqua": "#7FCACC", "mauve": "#9E8B94", "biscuit": "#D9B98C", "milky white": "#F5F3EC", "pear wood": "#DDAE6B", "weather brown": "#4E342E", "marble beige": "#E8DFC9", "iron black": "#232323", "silver grey": "#B0B0B0", "olive grey": "#7A7A66", "metallic dark": "#4A4A4A" };
const colorHex = (n) => COLORS[String(n).trim().toLowerCase()] || "#B8AFA3";
const MATTRESS_OPTIONS = [
  { key: "Collection", values: ["Natural Elements", "Elevate", "Iconic", "Dynamic", "Orthopedic"] },
  { key: "Material", values: ["Coir", "Spring", "Foam", "Natural Latex", "Memory Foam"] },
  { key: "Firmness", values: ["Extra Firm", "Medium Firm", "Soft"] },
  { key: "Size", values: ["Single Bed", "Double Bed", "Queen Size", "King Size"] },
];

let product = null, selectedColor = "", options = {};
const toast = (m) => { const t = document.getElementById("toast"); t.textContent = m; t.style.display = "block"; setTimeout(() => (t.style.display = "none"), 3000); };

async function init() {
  const id = new URLSearchParams(location.search).get("id");
  const res = await fetch("/api/products/" + id);
  if (!res.ok) { document.body.insertAdjacentHTML("beforeend", "<p style='padding:40px'>Product not found.</p>"); return; }
  product = await res.json();
  document.title = product.name + " — MAHADEVI FURNITURES";
  document.getElementById("layout").style.display = "";
  document.getElementById("pd-cat").textContent = product.category;
  document.getElementById("pd-name").textContent = product.name;
  document.getElementById("pd-price").textContent = inr(product.price);
  if (product.mrp > product.price) document.getElementById("pd-mrp").textContent = inr(product.mrp);
  document.getElementById("pd-desc").textContent = product.description;
  if (product.category === "Plastic Chairs" || /warranty/i.test(product.description || "")) document.getElementById("pd-warranty").style.display = "inline-flex";

  const badge = document.getElementById("pd-badge");
  if (product.sold_out) { badge.textContent = "Sold Out"; badge.classList.add("sold"); badge.style.display = ""; document.getElementById("order-btn").disabled = true; document.getElementById("order-btn").textContent = "Sold Out"; }
  else if (product.mrp > product.price) { badge.textContent = Math.round((1 - product.price / product.mrp) * 100) + "% Off"; badge.style.display = ""; }

  setImage();

  if ((product.colors || []).length) {
    document.getElementById("colors-wrap").style.display = "";
    document.getElementById("swatches").innerHTML = product.colors.map((c) =>
      `<button data-c="${c}"><span class="dot" style="background:${colorHex(c)}"></span>${c}</button>`).join("");
    document.getElementById("swatches").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      selectedColor = b.dataset.c;
      document.getElementById("sel-color").textContent = "— " + selectedColor;
      document.querySelectorAll("#swatches button").forEach((x) => x.classList.toggle("active", x === b));
      setImage();
    });
  }

  if (product.category === "Mattresses") {
    document.getElementById("mattress-opts").innerHTML = MATTRESS_OPTIONS.map((g) =>
      `<label>${g.key}</label><div class="swatches" data-k="${g.key}">${g.values.map((v) => `<button data-v="${v}">${v}</button>`).join("")}</div>`).join("");
    document.getElementById("mattress-opts").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const wrap = b.parentElement;
      options[wrap.dataset.k] = b.dataset.v;
      wrap.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
    });
  }

  // magnifier
  const box = document.getElementById("zoombox"), img = document.getElementById("pd-img");
  box.addEventListener("mousemove", (e) => {
    const r = box.getBoundingClientRect();
    img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    img.style.transform = "scale(2.2)";
  });
  box.addEventListener("mouseleave", () => (img.style.transform = "scale(1)"));

  document.getElementById("order-btn").addEventListener("click", () => {
    if ((product.colors || []).length && !selectedColor) return toast("Please select a colour first.");
    if (product.category === "Mattresses") {
      const missing = MATTRESS_OPTIONS.find((g) => !options[g.key]);
      if (missing) return toast(`Please select a ${missing.key.toLowerCase()} first.`);
    }
    document.getElementById("order-dialog").showModal();
  });

  document.getElementById("order-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = {
      product_name: product.name, color: selectedColor, options,
      quantity: Number(document.getElementById("of-qty").value) || 1,
      name: document.getElementById("of-name").value,
      phone: document.getElementById("of-phone").value,
      address: document.getElementById("of-address").value,
    };
    const r = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json();
    if (data.wa_link) { window.open(data.wa_link, "_blank"); document.getElementById("order-dialog").close(); toast("Opening WhatsApp with your order…"); }
    else toast("Could not create order.");
  });
}

function setImage() {
  const src = (selectedColor && product.color_images && product.color_images[selectedColor]) || product.image_url;
  const img = document.getElementById("pd-img");
  img.src = src;
  img.alt = product.name + (selectedColor ? " — " + selectedColor : "");
}

init();
