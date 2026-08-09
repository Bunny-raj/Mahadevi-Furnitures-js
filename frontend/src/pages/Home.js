import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api";
import Reveal from "@/components/Reveal";
import Marquee from "@/components/Marquee";
import ProductCard from "@/components/ProductCard";

const HERO_IMAGE = "https://images.pexels.com/photos/27638192/pexels-photo-27638192.jpeg?auto=compress&cs=tinysrgb&w=1600";
const SPOTLIGHT_IMAGE = "https://images.pexels.com/photos/7018400/pexels-photo-7018400.jpeg?auto=compress&cs=tinysrgb&w=1200";
const CRAFT_IMAGE = "https://images.pexels.com/photos/32331030/pexels-photo-32331030.png?auto=compress&cs=tinysrgb&w=1200";

const lineVariants = {
  hidden: { y: "115%" },
  show: (i) => ({
    y: "0%",
    transition: { duration: 1, delay: 0.2 + i * 0.14, ease: [0.22, 1, 0.36, 1] },
  }),
};

function HeroLine({ children, index, className = "" }) {
  return (
    <span className="block overflow-hidden pb-1">
      <motion.span
        className={`block ${className}`}
        custom={index}
        variants={lineVariants}
        initial="hidden"
        animate="show"
      >
        {children}
      </motion.span>
    </span>
  );
}

const CHAPTERS = [
  {
    num: "01",
    title: "Crafted by Hand",
    text: "Every piece leaves our shop floor built by skilled carpenters who treat wood like a family legacy — measured twice, joined once, finished with patience.",
  },
  {
    num: "02",
    title: "Honest Materials",
    text: "Seasoned hardwood, solid teak and fabrics chosen to outlast trends. What you see in the photograph is exactly what arrives at your door.",
  },
  {
    num: "03",
    title: "Fair Prices, Direct",
    text: "No middlemen, no showroom markup games. You order on WhatsApp, talk directly to us, and we deliver home. Simple as it should be.",
  },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  useEffect(() => {
    api.get("/products?featured=true").then((r) => setFeatured(r.data.slice(0, 6))).catch(() => {});
  }, []);

  return (
    <div data-testid="home-page">
      <section ref={heroRef} className="noise-overlay relative overflow-hidden bg-[#FAF7F2] pt-28 md:pt-36">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 md:grid-cols-12 md:px-10 md:pb-28">
          <motion.div style={{ y: textY }} className="relative z-10 flex flex-col justify-center md:col-span-7">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-xs uppercase tracking-[0.4em] text-[#8C5A35]"
              data-testid="hero-overline"
            >
              Mahadevi Furnitures — Home Essentials
            </motion.p>
            <h1 className="font-display mt-6 text-5xl font-medium leading-[1.05] tracking-tight text-[#1A1817] sm:text-6xl lg:text-7xl">
              <HeroLine index={0}>Furniture that</HeroLine>
              <HeroLine index={1} className="italic text-[#8C5A35]">turns a house</HeroLine>
              <HeroLine index={2}>into a home.</HeroLine>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 max-w-md text-base font-light leading-relaxed text-[#5C564F]"
            >
              Sofas, beds, wardrobes, dining sets, recliners and everything your home needs —
              browse the catalogue and order directly on WhatsApp.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.05, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link
                to="/catalogue"
                data-testid="hero-browse-catalogue-button"
                className="group flex items-center gap-3 bg-[#8C5A35] px-8 py-4 text-xs uppercase tracking-[0.25em] text-[#FAF7F2] transition-colors duration-300 hover:bg-[#734A2C]"
              >
                Browse Catalogue
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <a
                href="https://wa.me/919949700111"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="hero-whatsapp-button"
                className="flex items-center gap-3 border border-[#1A1817] px-8 py-4 text-xs uppercase tracking-[0.25em] text-[#1A1817] transition-colors duration-300 hover:bg-[#1A1817] hover:text-[#FAF7F2]"
              >
                WhatsApp Us
              </a>
            </motion.div>
          </motion.div>

          <div className="relative md:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-[4/5] overflow-hidden"
            >
              <motion.img
                src={HERO_IMAGE}
                alt="Premium sofa by Mahadevi Furnitures"
                style={{ y: imageY }}
                className="h-[115%] w-full object-cover"
                data-testid="hero-image"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-6 -left-6 border border-[#DCD6CD] bg-[#FAF7F2]/90 px-6 py-5 backdrop-blur-md md:-left-12"
            >
              <p className="font-display text-3xl font-bold text-[#1A1817]">500+</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-[#5C564F]">Happy Homes Furnished</p>
            </motion.div>
          </div>
        </div>
      </section>

      <Marquee />

      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6 md:mb-16">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.4em] text-[#8C5A35]">Selected Pieces</p>
            <h2 className="font-display mt-4 text-4xl font-medium tracking-tight text-[#1A1817] md:text-5xl">
              The pieces our customers<br className="hidden md:block" /> keep coming back for
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <Link
              to="/catalogue"
              data-testid="featured-view-all-link"
              className="group flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#8C5A35] transition-colors duration-300 hover:text-[#1A1817]"
            >
              View Full Catalogue
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 0.12}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="noise-overlay bg-[#1A1817] py-20 text-[#FAF7F2] md:py-32">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 md:grid-cols-12 md:px-10">
          <div className="md:col-span-5">
            <Reveal>
              <p className="text-xs uppercase tracking-[0.4em] text-[#8C5A35]">Our Manifesto</p>
              <h2 className="font-display mt-4 text-4xl font-medium leading-tight tracking-tight md:text-5xl">
                Why homes trust<br /><span className="italic text-[#D9C9BA]">Mahadevi</span>
              </h2>
            </Reveal>
            <Reveal delay={0.2} className="mt-10">
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={CRAFT_IMAGE}
                  alt="Craftsmanship at Mahadevi Furnitures"
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </Reveal>
          </div>
          <div className="flex flex-col justify-center gap-14 md:col-span-6 md:col-start-7">
            {CHAPTERS.map((c, i) => (
              <Reveal key={c.num} delay={i * 0.15}>
                <div className="flex gap-8 border-b border-[#FAF7F2]/10 pb-14 last:border-0 last:pb-0">
                  <span className="font-display text-6xl font-black leading-none text-outline-light md:text-7xl">
                    {c.num}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-medium tracking-tight">{c.title}</h3>
                    <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-[#EAE3D6]/70">
                      {c.text}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:px-10 md:py-28">
        <Reveal>
          <div className="aspect-square overflow-hidden">
            <img
              src={SPOTLIGHT_IMAGE}
              alt="Living room furnished by Mahadevi Furnitures"
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="text-xs uppercase tracking-[0.4em] text-[#8C5A35]">Everything For Home</p>
          <h2 className="font-display mt-4 text-4xl font-medium leading-tight tracking-tight text-[#1A1817] md:text-5xl">
            One shop. Every room.<br />Zero hassle.
          </h2>
          <p className="mt-6 max-w-md text-base font-light leading-relaxed text-[#5C564F]">
            From recliners for your evenings to office tables for your workdays — pick what you love,
            tap order, and your request lands straight on our WhatsApp. We confirm, we deliver.
          </p>
          <Link
            to="/catalogue"
            data-testid="spotlight-catalogue-button"
            className="group mt-10 inline-flex items-center gap-3 bg-[#1A1817] px-8 py-4 text-xs uppercase tracking-[0.25em] text-[#FAF7F2] transition-colors duration-300 hover:bg-[#8C5A35]"
          >
            Start Shopping
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
