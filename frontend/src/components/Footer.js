import { Link } from "react-router-dom";
import { MessageCircle, Phone, MapPin, Clock } from "lucide-react";
import useSettings from "@/hooks/useSettings";
import { imgUrl } from "@/lib/api";

export default function Footer() {
  const settings = useSettings();
  return (
    <footer data-testid="site-footer" className="noise-overlay bg-[#1A1817] text-[#EAE3D6]">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-3 md:px-10 md:py-24">
        <div>
          {settings?.logo_url ? (
            <img
              src={imgUrl(settings.logo_url)}
              alt="Mahadevi Furnitures"
              data-testid="footer-logo-image"
              className="h-12 w-auto object-contain"
            />
          ) : (
            <>
              <span className="font-display block text-2xl font-bold tracking-tight text-[#FAF7F2]">
                MAHADEVI
              </span>
              <span className="mt-1 block text-[10px] uppercase tracking-[0.45em] text-[#8C5A35]">
                Furnitures
              </span>
            </>
          )}
          <p className="mt-6 max-w-xs text-sm font-light leading-relaxed text-[#EAE3D6]/70">
            Furniture for every corner of your home — sofas, beds, wardrobes, dining sets and more.
            Fair prices, direct from the shop floor.
          </p>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.3em] text-[#8C5A35]">Explore</h4>
          <div className="mt-6 flex flex-col gap-3 text-sm font-light">
            <Link to="/" data-testid="footer-home-link" className="w-fit transition-colors duration-300 hover:text-[#FAF7F2]">
              Home
            </Link>
            <Link to="/catalogue" data-testid="footer-catalogue-link" className="w-fit transition-colors duration-300 hover:text-[#FAF7F2]">
              Full Catalogue
            </Link>
          </div>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.3em] text-[#8C5A35]">Talk To Us</h4>
          <div className="mt-6 flex flex-col gap-4 text-sm font-light">
            <a
              data-testid="footer-phone-link"
              href="tel:+919949700111"
              className="flex w-fit items-center gap-3 transition-colors duration-300 hover:text-[#FAF7F2]"
            >
              <Phone className="h-4 w-4 text-[#8C5A35]" /> +91 99497 00111
            </a>
            <a
              data-testid="footer-whatsapp-link"
              href="https://wa.me/919949700111"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-3 transition-colors duration-300 hover:text-[#FAF7F2]"
            >
              <MessageCircle className="h-4 w-4 text-[#8C5A35]" /> Order on WhatsApp
            </a>
            {settings?.address && (
              <p data-testid="footer-address" className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#8C5A35]" /> {settings.address}
              </p>
            )}
            {settings?.hours && (
              <p data-testid="footer-hours" className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#8C5A35]" /> {settings.hours}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-[#EAE3D6]/10 px-6 py-6 text-center text-xs font-light tracking-widest text-[#EAE3D6]/40 md:px-10">
        © {new Date().getFullYear()} MAHADEVI FURNITURES — CRAFTED FOR HOME
      </div>
    </footer>
  );
}
