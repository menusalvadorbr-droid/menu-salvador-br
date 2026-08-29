import { TextoInterface } from './TraducaoCardapio'

export default function SecaoLocalizacao({ mapUrl, linkAbrirMapa }: { mapUrl: string; linkAbrirMapa: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-800">
          📍 <TextoInterface chave="secao_localizacao">Localização</TextoInterface>
        </h2>
        <a
          href={linkAbrirMapa}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-orange-600 hover:underline"
        >
          <TextoInterface chave="abrir_google_maps">Abrir no Google Maps</TextoInterface>
        </a>
      </div>
      <div className="h-56 w-full overflow-hidden rounded-xl border border-neutral-200">
        <iframe src={mapUrl} width="100%" height="100%" style={{ border: 'none' }} loading="lazy" allowFullScreen />
      </div>
    </div>
  )
}
