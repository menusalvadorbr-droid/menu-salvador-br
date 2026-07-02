import Link from 'next/link';

export default function BotaoFlutuante() {
  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden">
      <Link
        href="/estabelecimentos/novo"
        className="bg-orange-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl animate-bounce"
        title="Cadastre seu estabelecimento"
      >
        🏪
      </Link>
    </div>
  );
}