import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, ShieldCheck, Truck, BadgeIndianRupee, ZoomIn } from "lucide-react";
import { api, imgUrl } from "@/lib/api";
import { inr, discountPct, colorHex, colorSlug } from "@/lib/format";
import Reveal from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";
import OrderDialog from "@/components/OrderDialog";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const onZoomMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  useEffect(() => {
    setProduct(null);
    setNotFound(false);
    setSelectedColor("");
    api
      .get(`/products/${id}`)
      .then((r) => {
        setProduct(r.data);
        api.get("/products").then((all) => {
          setRelated(all.data.filter((p) => p.category === r.data.category && p.id !== r.data.id).slice(0, 3));
        });
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div data-testid="product-not-found" className="mx-auto max-w-7xl px-6 py-40 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-[#5C564F]">This piece is no longer available</p>
        <Link to="/catalogue" className="font-display mt-6 inline-block text-2xl italic text-[#8C5A35]">
          Back to the catalogue
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div data-testid="product-loading" className="mx-auto max-w-7xl px-6 py-40 text-center text-sm uppercase tracking-[0.3em] text-[#5C564F]">
        Loading…
      </div>
    );
  }

  return (
    <div data-testid="product-detail-page" className="mx-auto max-w-7xl px-6 pb-24 pt-28 md:px-10 md:pt-36">
      <Reveal>
        <Link
          to="/catalogue"
          data-testid="back-to-catalogue-link"
          className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#5C564F] transition-colors duration-300 hover:text-[#8C5A35]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
          Catalogue
        </Link>
      </Reveal>

      <div className="mt-10 grid gap-14 lg:grid-cols-2">
        <Reveal>
          <div
            className="sticky top-28 aspect-[4/5] overflow-hidden bg-[#EAE3D6]"
            data-testid="product-image-magnifier"
            onMouseEnter={() => setZoom(true)}
            onMouseLeave={() => setZoom(false)}
            onMouseMove={onZoomMove}
            onClick={() => setZoom((z) => !z)}
            style={{ cursor: zoom ? "zoom-out" : "zoom-in" }}
          >
            <img
              key={(selectedColor && product.color_images?.[selectedColor]) || product.image_url}
              src={imgUrl((selectedColor && product.color_images?.[selectedColor]) || product.image_url)}
              alt={selectedColor ? `${product.name} — ${selectedColor}` : product.name}
              data-testid="product-detail-image"
              className="h-full w-full object-cover transition-transform duration-200 ease-out"
              style={{
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                transform: zoom ? "scale(2.2)" : "scale(1)",
              }}
            />
            {!zoom && (
              <span className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-1.5 bg-[#1A1817]/70 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[#FAF7F2] backdrop-blur-sm">
                <ZoomIn className="h-3 w-3" /> Hover to zoom
              </span>
            )}
            {product.sold_out ? (
              <span
                data-testid="product-sold-out-badge"
                className="absolute left-5 top-5 bg-[#1A1817] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#FAF7F2]"
              >
                Sold Out
              </span>
            ) : (
              discountPct(product) > 0 && (
                <span
                  data-testid="product-discount-badge"
                  className="absolute left-5 top-5 bg-[#8C5A35] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#FAF7F2]"
                >
                  {discountPct(product)}% Off
                </span>
              )
            )}
          </div>
        </Reveal>

        <Reveal delay={0.15} className="flex flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.4em] text-[#8C5A35]" data-testid="product-category">
            {product.category}
          </p>
          <h1 className="font-display mt-4 text-4xl font-medium leading-tight tracking-tight text-[#1A1817] md:text-5xl" data-testid="product-name">
            {product.name}
          </h1>
          <div className="mt-6 flex flex-wrap items-baseline gap-4">
            <p className="font-display text-3xl font-bold text-[#8C5A35]" data-testid="product-price">
              {inr(product.price)}
            </p>
            {Number(product.mrp) > Number(product.price) && (
              <>
                <p className="text-lg font-light text-[#5C564F] line-through" data-testid="product-mrp">
                  {inr(product.mrp)}
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-[#8C5A35]" data-testid="product-savings">
                  You save {inr(product.mrp - product.price)}
                </p>
              </>
            )}
          </div>
          <p className="mt-8 max-w-md text-base font-light leading-relaxed text-[#5C564F]" data-testid="product-description">
            {product.description}
          </p>

          {product.colors?.length > 0 && (
            <div className="mt-8" data-testid="product-color-picker">
              <p className="text-xs uppercase tracking-[0.25em] text-[#5C564F]">
                Available Colours{selectedColor && <span className="ml-2 normal-case tracking-normal text-[#8C5A35]">— {selectedColor}</span>}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    data-testid={`color-option-${colorSlug(c)}`}
                    onClick={() => setSelectedColor(c)}
                    className={`flex items-center gap-2 border px-4 py-2.5 text-xs transition-colors duration-200 ${
                      selectedColor === c
                        ? "border-[#8C5A35] bg-[#8C5A35]/10 text-[#8C5A35]"
                        : "border-[#DCD6CD] bg-white text-[#5C564F] hover:border-[#8C5A35]"
                    }`}
                  >
                    <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: colorHex(c) }} />
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.sold_out ? (
            <div
              data-testid="sold-out-notice"
              className="mt-10 flex w-full max-w-md flex-col items-center gap-2 border border-[#DCD6CD] bg-[#EAE3D6] px-8 py-5 text-center"
            >
              <span className="text-xs uppercase tracking-[0.25em] text-[#1A1817]">Currently Sold Out</span>
              <a
                href={`https://wa.me/919949700111?text=${encodeURIComponent(`Hello MAHADEVI FURNITURES! Is "${product.name}" coming back in stock? Please let me know.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="sold-out-whatsapp-link"
                className="text-xs font-light text-[#8C5A35] underline underline-offset-4"
              >
                WhatsApp us to ask when it's back
              </a>
            </div>
          ) : (
            <button
              data-testid="whatsapp-order-btn"
              onClick={() => setOrderOpen(true)}
              className="mt-10 flex w-full max-w-md items-center justify-center gap-3 bg-[#25D366] px-8 py-5 text-xs uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-[#1eb85a]"
            >
              <MessageCircle className="h-5 w-5" />
              Order Now on WhatsApp
            </button>
          )}

          <div className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-[#DCD6CD] pt-8">
            {[
              { icon: ShieldCheck, label: "Quality Checked" },
              { icon: Truck, label: "Home Delivery" },
              { icon: BadgeIndianRupee, label: "Fair Direct Price" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-start gap-2">
                <Icon className="h-5 w-5 text-[#8C5A35]" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#5C564F]">{label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {related.length > 0 && (
        <section className="mt-24 border-t border-[#DCD6CD] pt-16 md:mt-32">
          <Reveal>
            <h2 className="font-display text-3xl font-medium tracking-tight text-[#1A1817] md:text-4xl">
              More in <span className="italic text-[#8C5A35]">{product.category}</span>
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.1}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <OrderDialog product={product} open={orderOpen} onOpenChange={setOrderOpen} initialColor={selectedColor} />
    </div>
  );
}
