import {
  Playfair_Display,
  Lora,
  Poppins,
  Inter,
  Fredoka,
  Caveat,
  Bebas_Neue,
  Montserrat,
  Roboto_Slab,
  Space_Mono,
} from 'next/font/google'

// As 10 fontes que um tema pode escolher — carregadas aqui uma vez
// (next/font faz o self-host em build time) e reaproveitadas tanto no
// admin (seletor com preview + prévia do tema) quanto na página pública
// do cardápio. Usar `.className` (não `.variable`) por request: só a
// fonte de fato escolhida por aquele tema entra no HTML da página —
// next/font só injeta o preload da fonte cujo className aparece
// renderizado, não das outras 9.
const playfairDisplay = Playfair_Display({ subsets: ['latin'], weight: ['400', '700'] })
const lora = Lora({ subsets: ['latin'], weight: ['400', '700'] })
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '700'] })
const inter = Inter({ subsets: ['latin'], weight: ['400', '700'] })
const fredoka = Fredoka({ subsets: ['latin'], weight: ['400', '700'] })
const caveat = Caveat({ subsets: ['latin'], weight: ['400', '700'] })
const bebasNeue = Bebas_Neue({ subsets: ['latin'], weight: '400' })
const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '700'] })
const robotoSlab = Roboto_Slab({ subsets: ['latin'], weight: ['400', '700'] })
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'] })

export interface FonteTema {
  nome: string
  className: string
}

export const FONTES_TEMA: FonteTema[] = [
  { nome: 'Playfair Display', className: playfairDisplay.className },
  { nome: 'Lora', className: lora.className },
  { nome: 'Poppins', className: poppins.className },
  { nome: 'Inter', className: inter.className },
  { nome: 'Fredoka', className: fredoka.className },
  { nome: 'Caveat', className: caveat.className },
  { nome: 'Bebas Neue', className: bebasNeue.className },
  { nome: 'Montserrat', className: montserrat.className },
  { nome: 'Roboto Slab', className: robotoSlab.className },
  { nome: 'Space Mono', className: spaceMono.className },
]

export const FONTE_TEMA_PADRAO = FONTES_TEMA[3] // Inter

export function obterFonteTema(nome: string | null | undefined): FonteTema {
  return FONTES_TEMA.find((f) => f.nome === nome) || FONTE_TEMA_PADRAO
}
