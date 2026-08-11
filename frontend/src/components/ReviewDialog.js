import { useState } from "react";
import { Star, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api, formatApiError, imgUrl } from "@/lib/api";

export default function ReviewDialog({ open, onOpenChange }) {
  const [form, setForm] = useState({ name: "", rating: 5, text: "", photo_url: "" });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const onPickPhoto = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const { data } = await api.post("/reviews/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((prev) => ({ ...prev, photo_url: data.url }));
      toast.success("Photo added.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/reviews", form);
      toast.success("Thank you! Your review will appear once it is approved.");
      onOpenChange(false);
      setForm({ name: "", rating: 5, text: "", photo_url: "" });
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="review-dialog" className="rounded-none border-[#DCD6CD] bg-[#FAF7F2] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-tight text-[#1A1817]">
            Share Your Experience
          </DialogTitle>
          <DialogDescription className="text-sm font-light text-[#5C564F]">
            Tell other families about your Mahadevi furniture — add a photo of it in your home if you like.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="mt-2 flex flex-col gap-4">
          <div>
            <Label htmlFor="review-name" className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Your Name</Label>
            <Input
              id="review-name"
              data-testid="review-name-input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              className="mt-2 rounded-none border-[#DCD6CD] bg-white focus-visible:ring-[#8C5A35]/50"
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Your Rating</Label>
            <div className="mt-2 flex gap-1" data-testid="review-rating-picker">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  data-testid={`review-star-${n}`}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onClick={() => setForm({ ...form, rating: n })}
                  className="p-0.5 transition-transform duration-200 hover:scale-110"
                >
                  <Star className={`h-6 w-6 ${n <= form.rating ? "fill-[#C9A227] text-[#C9A227]" : "text-[#DCD6CD]"}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="review-text" className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Your Review</Label>
            <Textarea
              id="review-text"
              data-testid="review-text-input"
              required
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              placeholder="What did you buy? How was the quality and delivery?"
              className="mt-2 rounded-none border-[#DCD6CD] bg-white focus-visible:ring-[#8C5A35]/50"
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-[0.2em] text-[#5C564F]">Photo of Your Furniture (optional)</Label>
            <div className="mt-2 flex items-center gap-3">
              {form.photo_url && (
                <img src={imgUrl(form.photo_url)} alt="Your furniture" data-testid="review-photo-preview" className="h-16 w-16 border border-[#DCD6CD] object-cover" />
              )}
              <input id="review-photo-file" data-testid="review-photo-file" type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
              <label
                htmlFor="review-photo-file"
                data-testid="review-photo-upload-button"
                className="flex w-fit cursor-pointer items-center gap-2 border border-[#1A1817] px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-[#1A1817] transition-colors duration-300 hover:bg-[#1A1817] hover:text-[#FAF7F2]"
              >
                <Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading…" : "Add Photo"}
              </label>
            </div>
          </div>
          <Button
            data-testid="review-submit-button"
            type="submit"
            disabled={loading || uploading}
            className="rounded-none bg-[#8C5A35] py-6 text-xs uppercase tracking-[0.25em] text-[#FAF7F2] hover:bg-[#734A2C]"
          >
            {loading ? "Sending…" : "Submit Review"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
