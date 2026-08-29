import { TextoInterface } from './TraducaoCardapio'

export default function SecaoSobre({
  tipoLogradouro,
  endereco,
  numero,
  bairro,
  cidade,
}: {
  tipoLogradouro: string | null
  endereco: string | null
  numero: string | null
  bairro: string | null
  cidade: string
}) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-neutral-800">
        📝 <TextoInterface chave="secao_sobre">Sobre</TextoInterface>
      </h2>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-700">
          <TextoInterface chave="endereco_label">Endereço</TextoInterface>
        </h3>
        <p className="text-sm text-neutral-700">
          {[[tipoLogradouro, endereco].filter(Boolean).join(' '), numero].filter(Boolean).join(', ') || (
            <TextoInterface chave="endereco_nao_informado">Endereço não informado</TextoInterface>
          )}
        </p>
        <p className="text-xs text-neutral-500">
          {bairro ? `${bairro} - ` : ''}
          {cidade}, BA
        </p>
      </div>
    </div>
  )
}
