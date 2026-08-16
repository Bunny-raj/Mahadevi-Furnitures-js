let token = "", products = [];
const toast = (m) => { const t = document.getElementById("toast"); t.textContent = m; t.style.display = "block"; setTimeout(() => (t.style.display = "none"), 3000); };

document.getElementById("login-btn").addEventListener("click", async () => {
  const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: document.getElementById("pw").value }) });
  if (!r.ok) return toast("Wrong password");
  token = (await r.json()).token;
  document.getElementById("login-box").style.display = "none";
  document.getElementById("panel").style.display = "";
  load();
});

async function load() {
  products = await fetch("/api/products").then((r) => r.json());
  const cats = ["All", ...new Set(products.map((p) => p.category))];
  document.getElementById("cat-filter").innerHTML = cats.map((c) => `<option>${c}</option>`).join("");
  render();
  const orders = await fetch("/api/orders", { headers: { Authorization: "Bearer " + token } }).then((r) => r.json());
  document.querySelector("#orders-tbl tbody").innerHTML = orders.map((o) => `
    <tr><td>${new Date(o.created_at).toLocaleString("en-IN")}</td><td>${o.name}</td><td>${o.phone}</td>
    <td>${o.product_name}${o.color ? "<br><small>Colour: " + o.color + "</small>" : ""}</td><td>${o.quantity}</td></tr>`).join("") || "<tr><td colspan='5'>No orders yet</td></tr>";
}

function render() {
  const cat = document.getElementById("cat-filter").value || "All";
  const q = (document.getElementById("q").value || "").toLowerCase();
  const items = products.filter((p) => (cat === "All" || p.category === cat) && p.name.toLowerCase().includes(q));
  document.querySelector("#tbl tbody").innerHTML = items.map((p) => `
    <tr>
      <td><img src="${p.image_url}" alt="" /></td>
      <td>${p.name}</td><td>${p.category}</td>
      <td><input type="number" value="${p.price}" id="price-${p.id}" /></td>
      <td><input type="number" value="${p.mrp || 0}" id="mrp-${p.id}" /></td>
      <td><button class="save-btn" onclick="save('${p.id}')">Save</button></td>
    </tr>`).join("");
}

async function save(id) {
  const body = { price: Number(document.getElementById("price-" + id).value), mrp: Number(document.getElementById("mrp-" + id).value) };
  const r = await fetch("/api/products/" + id, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify(body) });
  if (r.ok) { toast("Price updated."); const p = products.find((x) => x.id === id); Object.assign(p, body); }
  else toast("Save failed.");
}

document.getElementById("cat-filter").addEventListener("change", render);
document.getElementById("q").addEventListener("input", render);
