import { useState } from "react";
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
import { inr } from "@/lib/format";

export default function OrderDialog({ product, open, onOpenChange }) {
  const [form, setForm] = useState({ name: "", phone: "", quantity: 1, address: "" });
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const qty = Math.max(1, Number(form.quantity) || 1);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/orders", {
        product_id: product.id,
        product_name: product.name,
        quantity: qty,
        name: form.name,
        phone: form.phone,
        address: form.address,
      });
      window.open(data.wa_link, "_blank");
      toast.success("Order ready — opening WhatsApp to send it to us.");
      onOpenChange(false);
      setForm({ name: "", phone: "", quantity: 1, address: "" });
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
