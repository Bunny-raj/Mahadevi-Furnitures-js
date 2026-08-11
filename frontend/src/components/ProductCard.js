import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { inr, discountPct } from "@/lib/format";
import { imgUrl } from "@/lib/api";

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/product/${product.id}`}
      data-testid={`product-card-${product.id}`}
      className="group block"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#EAE3D6]">
        {product.sold_out ? (
          <span
            data-testid={`sold-out-badge-${product.id}`}
            className="absolute left-4 top-4 z-10 bg-[#1A1817] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[#FAF7F2]"
          >
            Sold Out
          </span>
        ) : (
          discountPct(product) > 0 && (
            <span
              data-testid={`discount-badge-${product.id}`}
              className="absolute left-4 top-4 z-10 bg-[#8C5A35] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[#FAF7F2]"
            >
              {discountPct(product)}% Off
            </span>
          )
        )}
        <img
          src={imgUrl(product.image_url)}
          alt={product.name}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
            product.sold_out ? "opacity-60 grayscale" : ""
          }`}
        />
        <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center bg-[#FAF7F2]/90 opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4 text-[#1A1817]" />
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#8C5A35]">{product.category}</p>
          <h3 className="mt-1 text-base font-medium text-[#1A1817] transition-colors duration-300 group-hover:text-[#8C5A35]">
            {product.name}
          </h3>
        </div>
        <div className="text-right">
          <p className="font-display whitespace-nowrap text-lg font-bold text-[#1A1817]">
            {inr(product.price)}
          </p>
          {Number(product.mrp) > Number(product.price) && (
            <p className="text-xs font-light text-[#5C564F] line-through">{inr(product.mrp)}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
