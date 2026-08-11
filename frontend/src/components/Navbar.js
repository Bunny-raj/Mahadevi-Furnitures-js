import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, MessageCircle } from "lucide-react";
import useSettings from "@/hooks/useSettings";
import { imgUrl } from "@/lib/api";

const WA_LINK = "https://wa.me/919949700111?text=" +
  encodeURIComponent("Hello MAHADEVI FURNITURES! I have a question about your furniture.");

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const settings = useSettings();

  const linkCls = ({ isActive }) =>
    `text-xs uppercase tracking-[0.22em] transition-colors duration-300 ${
      isActive ? "text-[#8C5A35]" : "text-[#5C564F] hover:text-[#1A1817]"
    }`;

  return (
    <header
      data-testid="main-navbar"
      className="fixed inset-x-0 top-0 z-40 border-b border-[#DCD6CD] bg-[#FAF7F2]/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:h-20 md:px-10">
        <Link to="/" data-testid="navbar-logo" className="leading-none">
          {settings?.logo_url ? (
            <img
              src={imgUrl(settings.logo_url)}
              alt="Mahadevi Furnitures"
              data-testid="navbar-logo-image"
              className="h-10 w-auto object-contain md:h-12"
            />
          ) : (
            <>
              <span className="font-display block text-lg font-bold tracking-tight text-[#1A1817] md:text-xl">
                MAHADEVI
              </span>
              <span className="block text-[10px] uppercase tracking-[0.45em] text-[#8C5A35]">
                Furnitures
              </span>
            </>
          )}
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          <NavLink to="/" data-testid="nav-home-link" className={linkCls} end>
            Home
          </NavLink>
          <NavLink to="/catalogue" data-testid="nav-catalogue-link" className={linkCls}>
            Catalogue
          </NavLink>
          <a
            data-testid="nav-whatsapp-button"
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#1A1817] px-5 py-2.5 text-xs uppercase tracking-[0.22em] text-[#FAF7F2] transition-colors duration-300 hover:bg-[#8C5A35]"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp Us
          </a>
        </nav>

        <button
          data-testid="mobile-menu-toggle"
          aria-label="Toggle menu"
          onClick={() => setOpen(!open)}
          className="text-[#1A1817] md:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[#DCD6CD] bg-[#FAF7F2] px-6 py-6 md:hidden">
          <div className="flex flex-col gap-5">
            <NavLink to="/" data-testid="mobile-nav-home" className={linkCls} end onClick={() => setOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/catalogue" data-testid="mobile-nav-catalogue" className={linkCls} onClick={() => setOpen(false)}>
              Catalogue
            </NavLink>
            <a
              data-testid="mobile-nav-whatsapp"
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-2 bg-[#1A1817] px-5 py-2.5 text-xs uppercase tracking-[0.22em] text-[#FAF7F2]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp Us
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
