import GaleriaEstabelecimento from './GaleriaEstabelecimento'
import { TextoInterface } from './TraducaoCardapio'

export default function SecaoGaleria({ fotos, nome }: { fotos: string[]; nome: string }) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-neutral-800">
        📸 <TextoInterface chave="secao_fotos">Fotos</TextoInterface>
      </h2>
      <GaleriaEstabelecimento fotos={fotos} nome={nome} />
    </div>
  )
}
