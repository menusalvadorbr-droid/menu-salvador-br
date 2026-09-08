import { TextoInterface } from './TraducaoCardapio'
import { formatarTelefone } from '@/lib/utils'

export default function SecaoContato({
  telefone,
  whatsapp,
  instagram,
  site,
  email,
}: {
  telefone: string | null
  whatsapp: string | null
  instagram: string | null
  site?: string | null
  email?: string | null
}) {
  const temAlgo = telefone || whatsapp || instagram || site || email
  const siteHref = site && (site.startsWith('http://') || site.startsWith('https://') ? site : `https://${site}`)
  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-neutral-800">
        📞 <TextoInterface chave="secao_contato">Contato</TextoInterface>
      </h2>
      <div className="space-y-1 text-sm text-neutral-700">
        {telefone && <p>📞 {formatarTelefone(telefone)}</p>}
        {whatsapp && <p>💬 {formatarTelefone(whatsapp)}</p>}
        {instagram && <p>📷 {instagram}</p>}
        {site && siteHref && (
          <p>
            🔗{' '}
            <a href={siteHref} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {site}
            </a>
          </p>
        )}
        {email && <p>✉️ {email}</p>}
        {!temAlgo && (
          <p className="text-neutral-400">
            <TextoInterface chave="contato_nao_informado">Contato não informado</TextoInterface>
          </p>
        )}
      </div>
    </div>
  )
}
