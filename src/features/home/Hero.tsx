interface HeroProps {
  backgroundImage?: string;
  fontColor?: string;
  totalScans: number;
  totalEstabs: number;
}

export default function Hero({ backgroundImage, fontColor = '#ffffff', totalScans, totalEstabs }: HeroProps) {
  return (
    <section
      className="relative py-10 md:py-14 overflow-hidden bg-gradient-to-br from-orange-600 via-red-500 to-yellow-500"
      style={
        backgroundImage
          ? {
              backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      <div className="container mx-auto px-4 text-center relative z-10">
        <h1 className="text-4xl md:text-5xl font-black mb-2" style={{ color: fontColor }}>
          menu<span style={{ color: '#fde047' }}>.salvador</span>
        </h1>
        <p className="text-lg md:text-xl mb-4 opacity-90 max-w-xl mx-auto" style={{ color: fontColor }}>
          Descubra onde comer agora mesmo. Escaneie o QR Code na mesa e veja o cardápio sem baixar nada.
        </p>
        <div className="flex justify-center gap-6 text-sm" style={{ color: fontColor }}>
          <span>📱 {totalScans} scans hoje</span>
          <span>🏪 {totalEstabs} estabelecimentos</span>
        </div>
      </div>
    </section>
  );
}