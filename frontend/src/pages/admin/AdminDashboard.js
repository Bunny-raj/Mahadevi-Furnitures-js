import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Package, ShoppingBag, LogOut, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { inr } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { CATEGORIES } from "@/constants/categories";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const EMPTY_FORM = { name: "", category: "Sofas", price: "", image_url: "", description: "", featured: false };

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(() => {
    api.get("/products").then((r) => setProducts(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      fetchProducts();
      api.get("/orders").then((r) => setOrders(r.data)).catch(() => {});
    }
  }, [user, fetchProducts]);

  if (user === null) {
    return (
      <div data-testid="admin-loading" className="flex min-h-screen items-center justify-center bg-[#F5F2EC] text-xs uppercase tracking-[0.3em] text-[#5C564F]">
        Loading…
      </div>
    );
  }
  if (user === false) return <Navigate to="/admin/login" replace />;

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, category: p.category, price: String(p.price), image_url: p.image_url, description: p.description, featured: p.featured });
    setDialogOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, price: Number(form.price) || 0 };
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, payload);
        toast.success("Product updated — live on the website now.");
      } else {
        await api.post("/products", payload);
        toast.success("Product added — live on the website now.");
      }
      setDialogOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      toast.success("Product deleted.");
      fetchProducts();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const doLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const tabBtn = (key, label, Icon, suffix = "") => (
    <button
      key={key}
      data-testid={`admin-tab-${key}${suffix}`}
      onClick={() => setTab(key)}
      className={`flex w-full items-center gap-3 px-6 py-3.5 text-xs uppercase tracking-[0.22em] transition-colors duration-300 ${
        tab === key ? "bg-[#8C5A35] text-[#FAF7F2]" : "text-[#EAE3D6]/60 hover:text-[#EAE3D6]"
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );

  return (
    <div data-testid="admin-dashboard" className="flex min-h-screen bg-[#F5F2EC]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-[#1A1817] md:flex">
        <div className="border-b border-[#EAE3D6]/10 px-6 py-7 leading-none">
          <span className="font-display block text-lg font-bold tracking-tight text-[#FAF7F2]">MAHADEVI</span>
          <span className="mt-1 block text-[9px] uppercase tracking-[0.4em] text-[#8C5A35]">Furnitures · Admin</span>
        </div>
        <nav className="mt-4 flex flex-col">
          {tabBtn("products", "Products", Package)}
          {tabBtn("orders", "Orders", ShoppingBag)}
        </nav>
        <button
          data-testid="admin-logout-button"
          onClick={doLogout}
          className="mt-auto flex items-center gap-3 border-t border-[#EAE3D6]/10 px-6 py-5 text-xs uppercase tracking-[0.22em] text-[#EAE3D6]/60 transition-colors duration-300 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </aside>

      <div className="flex-1 md:ml-60">
        <div className="flex items-center justify-between border-b border-[#DCD6CD] bg-white px-6 py-5 md:px-10">
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight text-[#1A1817]">
              {tab === "products" ? "Products & Prices" : "Customer Orders"}
            </h1>
            <p className="mt-1 text-xs font-light text-[#5C564F]">
              {tab === "products"
                ? "Edit a price or product here — it updates on the website instantly."
                : "Orders customers sent to your WhatsApp."}
            </p>
          </div>
          {tab === "products" && (
            <Button
              data-testid="add-product-button"
              onClick={openAdd}
              className="rounded-none bg-[#8C5A35] text-xs uppercase tracking-[0.2em] text-[#FAF7F2] hover:bg-[#734A2C]"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          )}
        </div>

        <div className="flex gap-2 border-b border-[#DCD6CD] bg-[#1A1817] px-2 py-2 md:hidden">
          {tabBtn("products", "Products", Package, "-mobile")}
          {tabBtn("orders", "Orders", ShoppingBag, "-mobile")}
          <button data-testid="admin-logout-button-mobile" onClick={doLogout} className="flex items-center gap-2 px-4 text-xs uppercase tracking-[0.2em] text-[#EAE3D6]/60">
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 md:p-10">
          {tab === "products" && (
            <div className="border border-[#DCD6CD] bg-white" data-testid="products-table">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#DCD6CD]">
                    <TableHead className="text-xs uppercase tracking-[0.18em]">Product</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.18em]">Category</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.18em]">Price</TableHead>
                    <TableHead className="text-xs uppercase tracking-[0.18em]">Featured</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-[0.18em]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id} className="border-[#DCD6CD]" data-testid={`admin-product-row-${p.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img src={p.image_url} alt={p.name} className="h-12 w-12 bg-[#EAE3D6] object-cover" />
                          <span className="text-sm font-medium text-[#1A1817]">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-light text-[#5C564F]">{p.category}</TableCell>
                      <TableCell className="font-display text-base font-bold text-[#8C5A35]" data-testid={`admin-price-${p.id}`}>
                        {inr(p.price)}
                      </TableCell>
                      <TableCell>
                        {p.featured ? (
                          <span className="bg-[#8C5A35]/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[#8C5A35]">Featured</span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-[0.18em] text-[#5C564F]/50">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          data-testid={`edit-product-${p.id}`}
                          aria-label={`Edit ${p.name}`}
                          onClick={() => openEdit(p)}
                          className="mr-2 inline-flex h-9 w-9 items-center justify-center border border-[#DCD6CD] text-[#5C564F] transition-colors duration-300 hover:border-[#8C5A35] hover:text-[#8C5A35]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          data-testid={`delete-product-${p.id}`}
                          aria-label={`Delete ${p.name}`}
                          onClick={() => remove(p)}
                          className="inline-flex h-9 w-9 items-center justify-center border border-[#DCD6CD] text-[#5C564F] transition-colors duration-300 hover:border-red-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {tab === "orders" && (
            <div className="border border-[#DCD6CD] bg-white" data-testid="orders-table">
              {orders.length === 0 ? (
                <p className="px-6 py-16 text-center text-xs uppercase tracking-[0.25em] text-[#5C564F]" data-testid="orders-empty">
                  No orders yet — they'll appear here when customers order
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#DCD6CD]">
                      <TableHead className="text-xs uppercase tracking-[0.18em]">Date</TableHead>
                      <TableHead className="text-xs uppercase tracking-[0.18em]">Customer</TableHead>
                      <TableHead className="text-xs uppercase tracking-[0.18em]">Phone</TableHead>
                      <TableHead className="text-xs uppercase tracking-[0.18em]">Product</TableHead>
                      <TableHead className="text-xs uppercase tracking-[0.18em]">Qty</TableHead>
                      <TableHead className="text-xs uppercase tracking-[0.18em]">Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o.id} className="border-[#DCD6CD]" data-testid={`order-row-${o.id}`}>
                        <TableCell className="text-sm font-light text-[#5C564F]">
                          {new Date(o.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-[#1A1817]">{o.name}</TableCell>
                        <TableCell className="text-sm font-light text-[#5C564F]">{o.phone}</TableCell>
                        <TableCell className="text-sm font-light text-[#1A1817]">{o.product_name}</TableCell>
                        <TableCell className="text-sm font-light text-[#5C564F]">{o.quantity}</TableCell>
                        <TableCell className="max-w-56 truncate text-sm font-light text-[#5C564F]">{o.address || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="product-form-dialog" className="max-h-[90vh] overflow-y-auto rounded-none border-[#DCD6CD] bg-[#FAF7F2] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl tracking-tight text-[#1A1817]">
              {editing ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="mt-2 flex flex-col gap-4">
            <div>
              <Label className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Product Name</Label>
              <Input
                data-testid="product-form-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-2 rounded-none border-[#DCD6CD] bg-white focus-visible:ring-[#8C5A35]/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger data-testid="product-form-category" className="mt-2 rounded-none border-[#DCD6CD] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-[#DCD6CD]">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} data-testid={`category-option-${c.toLowerCase().replace(/\s+/g, "-")}`}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Price (₹)</Label>
                <Input
                  data-testid="product-form-price"
                  type="number"
                  min="0"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="mt-2 rounded-none border-[#DCD6CD] bg-white focus-visible:ring-[#8C5A35]/50"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Image URL</Label>
              <Input
                data-testid="product-form-image"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://…"
                className="mt-2 rounded-none border-[#DCD6CD] bg-white focus-visible:ring-[#8C5A35]/50"
              />
              {form.image_url && (
                <img src={form.image_url} alt="Preview" className="mt-3 h-28 w-28 border border-[#DCD6CD] object-cover" data-testid="product-form-image-preview" />
              )}
            </div>
            <div>
              <Label className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Description</Label>
              <Textarea
                data-testid="product-form-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-2 rounded-none border-[#DCD6CD] bg-white focus-visible:ring-[#8C5A35]/50"
              />
            </div>
            <div className="flex items-center justify-between border border-[#DCD6CD] bg-white px-4 py-3">
              <Label className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Show on Homepage (Featured)</Label>
              <Switch
                data-testid="product-form-featured"
                checked={form.featured}
                onCheckedChange={(v) => setForm({ ...form, featured: v })}
              />
            </div>
            <Button
              data-testid="product-form-save"
              type="submit"
              disabled={saving}
              className="rounded-none bg-[#8C5A35] py-6 text-xs uppercase tracking-[0.25em] text-[#FAF7F2] hover:bg-[#734A2C]"
            >
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Product"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
