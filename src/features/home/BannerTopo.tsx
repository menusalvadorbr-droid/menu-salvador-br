import Link from 'next/link';

export default function BannerTopo() {
  return (
    <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 px-4 text-center text-sm font-medium">
      🏪 É dono de restaurante?{' '}
      <Link href="/login" className="underline font-bold hover:text-yellow-200">
        Cadastre seu cardápio digital grátis
      </Link>
    </div>
  );
}