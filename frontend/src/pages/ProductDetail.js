import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, ShieldCheck, Truck, BadgeIndianRupee } from "lucide-react";
import { api, imgUrl } from "@/lib/api";
import { inr, discountPct } from "@/lib/format";
import Reveal from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";
import OrderDialog from "@/components/OrderDialog";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);

  useEffect(() => {
    setProduct(null);
    setNotFound(false);
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
          <div className="sticky top-28 aspect-[4/5] overflow-hidden bg-[#EAE3D6]">
            <img
              src={imgUrl(product.image_url)}
              alt={product.name}
              data-testid="product-detail-image"
              className="h-full w-full object-cover"
            />
            {discountPct(product) > 0 && (
              <span
                data-testid="product-discount-badge"
                className="absolute left-5 top-5 bg-[#8C5A35] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#FAF7F2]"
              >
                {discountPct(product)}% Off
              </span>
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

          <button
            data-testid="whatsapp-order-btn"
            onClick={() => setOrderOpen(true)}
            className="mt-10 flex w-full max-w-md items-center justify-center gap-3 bg-[#25D366] px-8 py-5 text-xs uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-[#1eb85a]"
          >
            <MessageCircle className="h-5 w-5" />
            Order Now on WhatsApp
          </button>

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

      <OrderDialog product={product} open={orderOpen} onOpenChange={setOrderOpen} />
    </div>
  );
}
