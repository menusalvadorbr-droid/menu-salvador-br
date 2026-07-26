interface HeroProps {
  backgroundImage?: string;
  fontColor?: string;
  totalScans: number;
  totalEstabs: number;
}

export default function Hero({ backgroundImage, fontColor = '#ffffff', totalScans, totalEstabs }: HeroProps) {
  return (
    <section
      className="relative overflow-hidden py-14 md:py-20"
      style={
        backgroundImage
          ? {
              backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : { background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }
      }
    >
      {/* Formas decorativas, só visual — não interativas */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-white/10 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-black/10 blur-3xl"
      />

      <div className="container relative z-10 mx-auto px-4 text-center">
        <h1 className="text-4xl font-black tracking-tight md:text-6xl" style={{ color: fontColor }}>
          menu<span className="opacity-90">.salvador</span>
        </h1>
        <p
          className="mx-auto mt-3 max-w-xl text-base md:text-xl"
          style={{ color: fontColor, opacity: 0.92 }}
        >
          Descubra onde comer agora mesmo. Escaneie o QR Code na mesa e veja o cardápio sem baixar nada.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm" style={{ color: fontColor }}>
            📱 {totalScans} scans hoje
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm" style={{ color: fontColor }}>
            🏪 {totalEstabs} estabelecimentos
          </span>
        </div>
      </div>
    </section>
  );
}
