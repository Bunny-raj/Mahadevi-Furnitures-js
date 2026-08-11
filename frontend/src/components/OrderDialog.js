import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { inr, colorHex, colorSlug } from "@/lib/format";

export default function OrderDialog({ product, open, onOpenChange, initialColor = "" }) {
  const [form, setForm] = useState({ name: "", phone: "", quantity: 1, address: "", color: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setForm((f) => ({ ...f, color: initialColor || "" }));
  }, [open, initialColor]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const qty = Math.max(1, Number(form.quantity) || 1);
  const colors = product.colors || [];

  const submit = async (e) => {
    e.preventDefault();
    if (colors.length > 0 && !form.color) {
      toast.error("Please select a colour first.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/orders", {
        product_id: product.id,
        product_name: product.name,
        quantity: qty,
        name: form.name,
        phone: form.phone,
        address: form.address,
        color: form.color,
      });
      window.open(data.wa_link, "_blank");
      toast.success("Order ready — opening WhatsApp to send it to us.");
      onOpenChange(false);
      setForm({ name: "", phone: "", quantity: 1, address: "", color: "" });
    } catch (err) {
      toast.error("Could not create the order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="order-dialog" className="rounded-none border-[#DCD6CD] bg-[#FAF7F2] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-tight text-[#1A1817]">
            Order via WhatsApp
          </DialogTitle>
          <DialogDescription className="text-sm font-light text-[#5C564F]">
            {product.name} — <span className="font-display font-bold text-[#8C5A35]">{inr(product.price)}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="mt-2 flex flex-col gap-4">
          {colors.length > 0 && (
            <div>
              <Label className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Choose Colour</Label>
              <div className="mt-2 flex flex-wrap gap-2" data-testid="order-color-picker">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    data-testid={`order-color-${colorSlug(c)}`}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`flex items-center gap-2 border px-3 py-2 text-xs transition-colors duration-200 ${
                      form.color === c
                        ? "border-[#8C5A35] bg-[#8C5A35]/10 text-[#8C5A35]"
                        : "border-[#DCD6CD] bg-white text-[#5C564F] hover:border-[#8C5A35]"
                    }`}
                  >
                    <span className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: colorHex(c) }} />
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="order-name" className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Your Name</Label>
            <Input
              id="order-name"
              data-testid="order-name-input"
              required
              value={form.name}
              onChange={set("name")}
              placeholder="Full name"
              className="mt-2 rounded-none border-[#DCD6CD] bg-white focus-visible:ring-[#8C5A35]/50"
            />
          </div>
          <div>
            <Label htmlFor="order-phone" className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Phone Number</Label>
            <Input
              id="order-phone"
              data-testid="order-phone-input"
              required
              value={form.phone}
              onChange={set("phone")}
              placeholder="Your mobile number"
              className="mt-2 rounded-none border-[#DCD6CD] bg-white focus-visible:ring-[#8C5A35]/50"
            />
          </div>
          <div>
            <Label htmlFor="order-quantity" className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Quantity</Label>
            <Input
              id="order-quantity"
              data-testid="order-quantity-input"
              type="number"
              min="1"
              required
              value={form.quantity}
              onChange={set("quantity")}
              className="mt-2 rounded-none border-[#DCD6CD] bg-white focus-visible:ring-[#8C5A35]/50"
            />
          </div>
          <div>
            <Label htmlFor="order-address" className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Delivery Address</Label>
            <Textarea
              id="order-address"
              data-testid="order-address-input"
              value={form.address}
              onChange={set("address")}
              placeholder="House no, street, area, city"
              className="mt-2 rounded-none border-[#DCD6CD] bg-white focus-visible:ring-[#8C5A35]/50"
            />
          </div>
          <div className="flex items-center justify-between border-t border-[#DCD6CD] pt-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#5C564F]">Estimated Total</p>
              <p data-testid="order-total-price" className="font-display text-xl font-bold text-[#1A1817]">
                {inr(product.price * qty)}
              </p>
            </div>
            <Button
              data-testid="order-submit-button"
              type="submit"
              disabled={loading}
              className="rounded-none bg-[#25D366] px-6 py-6 text-xs uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-[#1eb85a]"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              {loading ? "Preparing…" : "Send on WhatsApp"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
