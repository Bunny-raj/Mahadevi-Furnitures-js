import { useEffect, useState } from "react";
import { Star, PenLine } from "lucide-react";
import { api, imgUrl } from "@/lib/api";
import Reveal from "@/components/Reveal";
import ReviewDialog from "@/components/ReviewDialog";

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-4 w-4 ${n <= rating ? "fill-[#C9A227] text-[#C9A227]" : "text-[#DCD6CD]"}`} />
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get("/reviews").then((r) => setReviews(r.data)).catch(() => {});
  }, []);

  return (
    <section data-testid="reviews-section" className="noise-overlay bg-[#FAF7F2] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6 md:mb-16">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.4em] text-[#8C5A35]">Happy Customers</p>
            <h2 className="font-display mt-4 text-4xl font-medium tracking-tight text-[#1A1817] md:text-5xl">
              Homes that already<br className="hidden md:block" /> trust Mahadevi
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <button
              data-testid="write-review-button"
              onClick={() => setOpen(true)}
              className="group flex items-center gap-3 border border-[#1A1817] px-6 py-3.5 text-xs uppercase tracking-[0.25em] text-[#1A1817] transition-colors duration-300 hover:bg-[#1A1817] hover:text-[#FAF7F2]"
            >
              <PenLine className="h-4 w-4" /> Write a Review
            </button>
          </Reveal>
        </div>

        {reviews.length === 0 ? (
          <Reveal>
            <p data-testid="reviews-empty" className="text-sm font-light text-[#5C564F]">
              Be the first to share your Mahadevi experience.
            </p>
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.slice(0, 6).map((r, i) => (
              <Reveal key={r.id} delay={(i % 3) * 0.12}>
                <figure data-testid={`review-card-${r.id}`} className="flex h-full flex-col border border-[#DCD6CD] bg-white">
                  {r.photo_url && (
                    <div className="aspect-[4/3] overflow-hidden bg-[#EAE3D6]">
                      <img
                        src={imgUrl(r.photo_url)}
                        alt={`Furniture delivered to ${r.name}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-7">
                    <Stars rating={r.rating} />
                    <blockquote className="mt-4 flex-1 text-sm font-light leading-relaxed text-[#5C564F]">
                      “{r.text}”
                    </blockquote>
                    <figcaption className="mt-6 border-t border-[#DCD6CD] pt-4 text-xs uppercase tracking-[0.22em] text-[#1A1817]">
                      {r.name}
                    </figcaption>
                  </div>
                </figure>
              </Reveal>
            ))}
          </div>
        )}
      </div>
      <ReviewDialog open={open} onOpenChange={setOpen} />
    </section>
  );
}
