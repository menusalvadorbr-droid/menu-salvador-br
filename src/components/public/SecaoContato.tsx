import { TextoInterface } from './TraducaoCardapio'

export default function SecaoContato({
  telefone,
  whatsapp,
  instagram,
}: {
  telefone: string | null
  whatsapp: string | null
  instagram: string | null
}) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-neutral-800">
        📞 <TextoInterface chave="secao_contato">Contato</TextoInterface>
      </h2>
      <div className="space-y-1 text-sm text-neutral-700">
        {telefone && <p>📞 {telefone}</p>}
        {whatsapp && <p>💬 {whatsapp}</p>}
        {instagram && <p>📷 {instagram}</p>}
        {!telefone && !whatsapp && !instagram && (
          <p className="text-neutral-400">
            <TextoInterface chave="contato_nao_informado">Contato não informado</TextoInterface>
          </p>
        )}
      </div>
    </div>
  )
}
