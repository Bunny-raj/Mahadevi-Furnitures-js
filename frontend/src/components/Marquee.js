export default function Marquee() {
  const items = ["CRAFTED FOR HOME", "PREMIUM MATERIALS", "MAHADEVI FURNITURES", "FAIR PRICES, DIRECT"];
  const row = [...items, ...items, ...items];
  return (
    <div data-testid="editorial-marquee" className="overflow-hidden border-y border-[#DCD6CD] bg-[#EAE3D6] py-6">
      <div className="animate-marquee-slow flex w-max items-center gap-12">
        {[0, 1].map((half) => (
          <div key={half} className="flex items-center gap-12">
            {row.map((text, i) => (
              <span key={`${half}-${i}`} className="flex items-center gap-12">
                <span className="font-display whitespace-nowrap text-3xl italic text-outline md:text-5xl">
                  {text}
                </span>
                <span className="h-2 w-2 rounded-full bg-[#8C5A35]/60" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
