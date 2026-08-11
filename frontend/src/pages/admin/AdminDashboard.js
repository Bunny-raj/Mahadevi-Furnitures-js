import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Package, ShoppingBag, LogOut, Plus, Pencil, Trash2, Store, Upload, Star, MessageSquareQuote, Check, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError, imgUrl } from "@/lib/api";
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

const EMPTY_FORM = { name: "", category: "Sofas", price: "", mrp: "", image_url: "", description: "", featured: false, colors: "", sold_out: false };

const ORDER_STATUSES = ["pending", "confirmed", "delivered", "cancelled"];
const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ address: "", hours: "", map_embed_url: "", logo_url: "" });
  const [settingsSaving, setSettingsSaving] = useState(false);

  const fetchProducts = useCallback(() => {
    api.get("/products").then((r) => setProducts(r.data)).catch(() => {});
  }, []);

  const fetchReviews = useCallback(() => {
    api.get("/reviews/all").then((r) => setReviews(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchReviews();
      api.get("/orders").then((r) => setOrders(r.data)).catch(() => {});
      api.get("/settings").then((r) => {
        const { address = "", hours = "", map_embed_url = "", logo_url = "" } = r.data || {};
        setSettingsForm({ address, hours, map_embed_url, logo_url });
      }).catch(() => {});
    }
  }, [user, fetchProducts, fetchReviews]);

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
    setForm({ name: p.name, category: p.category, price: String(p.price), mrp: p.mrp ? String(p.mrp) : "", image_url: p.image_url, description: p.description, featured: p.featured, colors: (p.colors || []).join(", "), sold_out: !!p.sold_out });
    setDialogOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price) || 0,
      mrp: Number(form.mrp) || 0,
      colors: String(form.colors || "").split(",").map((c) => c.trim()).filter(Boolean),
    };
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

  const setOrderStatus = async (order, status) => {
    try {
      await api.put(`/orders/${order.id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
      toast.success(`Order marked as ${status}.`);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const setReviewApproval = async (review, approved) => {
    try {
      await api.put(`/reviews/${review.id}/approve`, { approved });
      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, approved } : r)));
      toast.success(approved ? "Review approved — now live on the website." : "Review hidden from the website.");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const deleteReview = async (review) => {
    if (!window.confirm(`Delete review by "${review.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/reviews/${review.id}`);
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
      toast.success("Review deleted.");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const uploadImage = async (file, onDone) => {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    onDone(data.url);
  };

  const onPickImage = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      await uploadImage(f, (url) => setForm((prev) => ({ ...prev, image_url: url })));
      toast.success("Photo uploaded.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const onPickLogo = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      await uploadImage(f, (url) => setSettingsForm((prev) => ({ ...prev, logo_url: url })));
      toast.success("Logo uploaded.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      await api.put("/settings", settingsForm);
      toast.success("Shop details saved — live on the website now.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSettingsSaving(false);
    }
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
          {tabBtn("reviews", "Reviews", MessageSquareQuote)}
          {tabBtn("settings", "Shop Settings", Store)}
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
              {tab === "products" ? "Products & Prices" : tab === "orders" ? "Customer Orders" : tab === "reviews" ? "Customer Reviews" : "Shop Settings"}
            </h1>
            <p className="mt-1 text-xs font-light text-[#5C564F]">
              {tab === "products"
                ? "Edit a price, MRP or product here — it updates on the website instantly."
                : tab === "orders"
                ? "Orders customers sent to your WhatsApp — track them from pending to delivered."
                : tab === "reviews"
                ? "Approve customer reviews to show them on the website, or delete unwanted ones."
                : "Your logo, showroom address, hours and map — shown across the website."}
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
          {tabBtn("reviews", "Reviews", MessageSquareQuote, "-mobile")}
          {tabBtn("settings", "Settings", Store, "-mobile")}
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
                          <div>
                            <span className="text-sm font-medium text-[#1A1817]">{p.name}</span>
                            {p.sold_out && (
                              <span className="ml-2 bg-[#1A1817] px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-[#FAF7F2]" data-testid={`admin-sold-out-${p.id}`}>Sold Out</span>
                            )}
                          </div>
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
                      <TableHead className="text-xs uppercase tracking-[0.18em]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => {
                      const status = ORDER_STATUSES.includes(o.status) ? o.status : "pending";
                      return (
                      <TableRow key={o.id} className="border-[#DCD6CD]" data-testid={`order-row-${o.id}`}>
                        <TableCell className="text-sm font-light text-[#5C564F]">
                          {new Date(o.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-[#1A1817]">{o.name}</TableCell>
                        <TableCell className="text-sm font-light text-[#5C564F]">{o.phone}</TableCell>
                        <TableCell className="text-sm font-light text-[#1A1817]">
                          {o.product_name}
                          {o.color && <span className="block text-xs text-[#8C5A35]">Colour: {o.color}</span>}
                        </TableCell>
                        <TableCell className="text-sm font-light text-[#5C564F]">{o.quantity}</TableCell>
                        <TableCell className="max-w-56 truncate text-sm font-light text-[#5C564F]">{o.address || "—"}</TableCell>
                        <TableCell>
                          <Select value={status} onValueChange={(v) => setOrderStatus(o, v)}>
                            <SelectTrigger
                              data-testid={`order-status-select-${o.id}`}
                              className={`h-8 w-32 rounded-none border-0 text-[10px] font-medium uppercase tracking-[0.12em] ${STATUS_STYLES[status]}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-none border-[#DCD6CD]">
                              {ORDER_STATUSES.map((s) => (
                                <SelectItem key={s} value={s} data-testid={`order-status-option-${s}`} className="text-xs uppercase tracking-[0.12em]">
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {tab === "reviews" && (
            <div className="border border-[#DCD6CD] bg-white" data-testid="reviews-table">
              {reviews.length === 0 ? (
                <p className="px-6 py-16 text-center text-xs uppercase tracking-[0.25em] text-[#5C564F]" data-testid="reviews-empty-admin">
                  No reviews yet — customers can write them from the home page
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#DCD6CD]">
                      <TableHead className="text-xs uppercase tracking-[0.18em]">Customer</TableHead>
                      <TableHead className="text-xs uppercase tracking-[0.18em]">Rating</TableHead>
                      <TableHead className="text-xs uppercase tracking-[0.18em]">Review</TableHead>
                      <TableHead className="text-xs uppercase tracking-[0.18em]">Status</TableHead>
                      <TableHead className="text-right text-xs uppercase tracking-[0.18em]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((r) => (
                      <TableRow key={r.id} className="border-[#DCD6CD]" data-testid={`review-row-${r.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {r.photo_url && (
                              <img src={imgUrl(r.photo_url)} alt={`By ${r.name}`} className="h-12 w-12 bg-[#EAE3D6] object-cover" />
                            )}
                            <span className="text-sm font-medium text-[#1A1817]">{r.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-[#C9A227] text-[#C9A227]" : "text-[#DCD6CD]"}`} />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-72 text-sm font-light text-[#5C564F]">
                          <span className="line-clamp-2">{r.text}</span>
                        </TableCell>
                        <TableCell>
                          {r.approved ? (
                            <span className="bg-green-100 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-green-800" data-testid={`review-status-${r.id}`}>Live</span>
                          ) : (
                            <span className="bg-amber-100 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-amber-800" data-testid={`review-status-${r.id}`}>Pending</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.approved ? (
                            <button
                              data-testid={`hide-review-${r.id}`}
                              aria-label={`Hide review by ${r.name}`}
                              onClick={() => setReviewApproval(r, false)}
                              className="mr-2 inline-flex h-9 w-9 items-center justify-center border border-[#DCD6CD] text-[#5C564F] transition-colors duration-300 hover:border-amber-500 hover:text-amber-600"
                              title="Hide from website"
                            >
                              <EyeOff className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              data-testid={`approve-review-${r.id}`}
                              aria-label={`Approve review by ${r.name}`}
                              onClick={() => setReviewApproval(r, true)}
                              className="mr-2 inline-flex h-9 w-9 items-center justify-center border border-[#DCD6CD] text-[#5C564F] transition-colors duration-300 hover:border-green-500 hover:text-green-600"
                              title="Approve — show on website"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            data-testid={`delete-review-${r.id}`}
                            aria-label={`Delete review by ${r.name}`}
                            onClick={() => deleteReview(r)}
                            className="inline-flex h-9 w-9 items-center justify-center border border-[#DCD6CD] text-[#5C564F] transition-colors duration-300 hover:border-red-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {tab === "settings" && (
            <form
              onSubmit={saveSettings}
              data-testid="settings-form"
              className="max-w-xl border border-[#DCD6CD] bg-white p-6 md:p-8"
            >
              <div className="flex flex-col gap-6">
                <div>
                  <Label className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Shop Logo</Label>
                  <div className="mt-3 flex items-center gap-4">
                    {settingsForm.logo_url ? (
                      <img
                        src={imgUrl(settingsForm.logo_url)}
                        alt="Shop logo"
                        data-testid="settings-logo-preview"
                        className="h-14 w-auto border border-[#DCD6CD] bg-[#FAF7F2] object-contain p-1"
                      />
                    ) : (
                      <span className="text-xs font-light text-[#5C564F]">
                        No logo yet — the text name shows on the website
                      </span>
                    )}
                    <input id="logo-file" data-testid="settings-logo-file" type="file" accept="image/*" onChange={onPickLogo} className="hidden" />
                    <label
                      htmlFor="logo-file"
                      data-testid="settings-logo-upload-button"
                      className="flex w-fit cursor-pointer items-center gap-2 border border-[#1A1817] px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-[#1A1817] transition-colors duration-300 hover:bg-[#1A1817] hover:text-[#FAF7F2]"
                    >
                      <Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading…" : "Upload Logo"}
                    </label>
                  </div>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Showroom Address</Label>
                  <Textarea
                    data-testid="settings-address-input"
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    placeholder="Shop no, street, area, city, PIN"
                    className="mt-2 rounded-none border-[#DCD6CD] bg-white focus-visible:ring-[#8C5A35]/50"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Business Hours</Label>
                  <Input
                    data-testid="settings-hours-input"
                    value={settingsForm.hours}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hours: e.target.value })}
                    placeholder="e.g. Mon–Sun, 10 AM – 9 PM"
                    className="mt-2 rounded-none border-[#DCD6CD] bg-white focus-visible:ring-[#8C5A35]/50"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Google Maps Embed URL (optional)</Label>
                  <Input
                    data-testid="settings-map-input"
                    value={settingsForm.map_embed_url}
                    onChange={(e) => setSettingsForm({ ...settingsForm, map_embed_url: e.target.value })}
                    placeholder="Google Maps → Share → Embed a map → copy the src link"
                    className="mt-2 rounded-none border-[#DCD6CD] bg-white focus-visible:ring-[#8C5A35]/50"
                  />
                </div>
                <Button
                  data-testid="settings-save-button"
                  type="submit"
                  disabled={settingsSaving}
                  className="rounded-none bg-[#8C5A35] py-6 text-xs uppercase tracking-[0.25em] text-[#FAF7F2] hover:bg-[#734A2C]"
                >
                  {settingsSaving ? "Saving…" : "Save Shop Details"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="product-form-dialog" aria-describedby={undefined} className="max-h-[90vh] overflow-y-auto rounded-none border-[#DCD6CD] bg-[#FAF7F2] sm:max-w-lg">
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
              <div>
                <Label className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">MRP ₹ (Before Discount)</Label>
                <Input
                  data-testid="product-form-mrp"
                  type="number"
                  min="0"
                  value={form.mrp}
                  onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                  placeholder="Optional"
                  className="mt-2 rounded-none border-[#DCD6CD] bg-white focus-visible:ring-[#8C5A35]/50"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Image URL</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  data-testid="product-form-image"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="Paste image URL, or upload →"
                  className="rounded-none border-[#DCD6CD] bg-white focus-visible:ring-[#8C5A35]/50"
                />
                <input id="product-photo-file" data-testid="product-form-file" type="file" accept="image/*" onChange={onPickImage} className="hidden" />
                <label
                  htmlFor="product-photo-file"
                  data-testid="product-form-upload-button"
                  className="flex cursor-pointer items-center gap-2 whitespace-nowrap border border-[#1A1817] px-4 text-[10px] uppercase tracking-[0.2em] text-[#1A1817] transition-colors duration-300 hover:bg-[#1A1817] hover:text-[#FAF7F2]"
                >
                  <Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading…" : "Upload"}
                </label>
              </div>
              {form.image_url && (
                <img src={imgUrl(form.image_url)} alt="Preview" className="mt-3 h-28 w-28 border border-[#DCD6CD] object-cover" data-testid="product-form-image-preview" />
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
            <div>
              <Label className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Available Colours (comma separated)</Label>
              <Input
                data-testid="product-form-colors"
                value={form.colors}
                onChange={(e) => setForm({ ...form, colors: e.target.value })}
                placeholder="e.g. Walnut Brown, Grey, Beige"
                className="mt-2 rounded-none border-[#DCD6CD] bg-white focus-visible:ring-[#8C5A35]/50"
              />
              <p className="mt-1.5 text-[11px] font-light text-[#5C564F]">Customers will pick one of these colours while ordering. Leave empty if not applicable.</p>
            </div>
            <div className="flex items-center justify-between border border-[#DCD6CD] bg-white px-4 py-3">
              <Label className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Show on Homepage (Featured)</Label>
              <Switch
                data-testid="product-form-featured"
                checked={form.featured}
                onCheckedChange={(v) => setForm({ ...form, featured: v })}
              />
            </div>
            <div className="flex items-center justify-between border border-[#DCD6CD] bg-white px-4 py-3">
              <div>
                <Label className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Mark as Sold Out</Label>
                <p className="mt-0.5 text-[11px] font-light text-[#5C564F]">Customers will see a Sold Out badge and can't order it.</p>
              </div>
              <Switch
                data-testid="product-form-sold-out"
                checked={form.sold_out}
                onCheckedChange={(v) => setForm({ ...form, sold_out: v })}
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
