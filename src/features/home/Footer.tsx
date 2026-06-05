import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 mt-12">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">menu.salvador.br</h2>
        <p className="text-gray-400 mb-6">O diretório de cardápios digitais de Salvador</p>
        <div className="flex justify-center gap-6 text-sm">
          <Link href="/login" className="hover:text-orange-400">Sou Dono</Link>
          <Link href="/admin" className="hover:text-orange-400">Admin</Link>
          <span className="text-gray-500">© 2024</span>
        </div>
      </div>
    </footer>
  );
}