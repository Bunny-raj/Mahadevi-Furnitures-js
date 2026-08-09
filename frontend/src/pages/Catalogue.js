import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { CATEGORIES } from "@/constants/categories";
import Reveal from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";

export default function Catalogue() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [params, setParams] = useSearchParams();
  const activeCategory = params.get("category") || "All";

  useEffect(() => {
    api
      .get("/products")
      .then((r) => setProducts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const catOk = activeCategory === "All" || p.category === activeCategory;
      const q = search.trim().toLowerCase();
      const searchOk = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      return catOk && searchOk;
    });
  }, [products, activeCategory, search]);

  const setCategory = (cat) => {
    if (cat === "All") params.delete("category");
    else params.set("category", cat);
    setParams(params, { replace: true });
  };

  return (
    <div data-testid="catalogue-page" className="mx-auto max-w-7xl px-6 pb-24 pt-28 md:px-10 md:pt-36">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.4em] text-[#8C5A35]">The Catalogue</p>
        <h1 className="font-display mt-4 text-4xl font-medium tracking-tight text-[#1A1817] md:text-6xl">
          Everything your <span className="italic text-[#8C5A35]">home</span> needs
        </h1>
        <p className="mt-6 max-w-lg text-base font-light leading-relaxed text-[#5C564F]">
          Pick a piece, tap order, and it lands straight on our WhatsApp. Prices are set by us directly — what you see is what you pay.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="mt-12">
        <div className="flex flex-col gap-6 border-y border-[#DCD6CD] py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" data-testid="category-filters">
            {["All", ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                data-testid={`filter-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 ${
                  activeCategory === cat
                    ? "bg-[#1A1817] text-[#FAF7F2]"
                    : "border border-[#DCD6CD] text-[#5C564F] hover:border-[#8C5A35] hover:text-[#8C5A35]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C564F]" />
            <input
              data-testid="catalogue-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search furniture…"
              className="w-full border border-[#DCD6CD] bg-white py-3 pl-11 pr-4 text-sm font-light text-[#1A1817] outline-none transition-colors duration-300 placeholder:text-[#5C564F]/60 focus:border-[#8C5A35]"
            />
          </div>
        </div>
      </Reveal>

      {loading ? (
        <p data-testid="catalogue-loading" className="py-24 text-center text-sm uppercase tracking-[0.3em] text-[#5C564F]">
          Loading collection…
        </p>
      ) : filtered.length === 0 ? (
        <p data-testid="catalogue-empty" className="py-24 text-center text-sm uppercase tracking-[0.3em] text-[#5C564F]">
          No pieces found — try another search
        </p>
      ) : (
        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3" data-testid="catalogue-grid">
          {filtered.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 0.1}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
