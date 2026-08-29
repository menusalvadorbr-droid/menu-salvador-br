import { ETIQUETA_ESTACIONAMENTO } from '@/lib/enderecoEstabelecimento'
import { TextoInterface } from './TraducaoCardapio'

export default function SecaoComodidades({
  aceitaPets,
  estacionamento,
  acessibilidade,
}: {
  aceitaPets: boolean | null
  estacionamento: string | null
  acessibilidade: string[] | null
}) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-neutral-800">
        ✨ <TextoInterface chave="secao_comodidades">Comodidades</TextoInterface>
      </h2>
      <div className="flex flex-wrap gap-2">
        {aceitaPets && (
          <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700">
            🐾 <TextoInterface chave="aceita_pets">Aceita pets</TextoInterface>
          </span>
        )}
        {estacionamento && estacionamento !== 'nao_tem' && (
          <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700">
            {ETIQUETA_ESTACIONAMENTO[estacionamento].emoji}{' '}
            <TextoInterface chave={ETIQUETA_ESTACIONAMENTO[estacionamento].chave}>
              {ETIQUETA_ESTACIONAMENTO[estacionamento].texto}
            </TextoInterface>
          </span>
        )}
        {(acessibilidade || []).map((item, i) => (
          <span key={i} className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700">
            ♿ {item}
          </span>
        ))}
      </div>
    </div>
  )
}
