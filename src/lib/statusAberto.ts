// src/lib/statusAberto.ts

/**
 * Interface para um horário de funcionamento
 */
interface Horario {
  dia_semana: number;        // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  horario_abertura: string;  // formato "HH:MM:SS" (ex: "08:00:00")
  horario_fechamento: string; // formato "HH:MM:SS" (ex: "22:00:00")
  fechado: boolean;          // true se o estabelecimento está fechado neste dia
}

/**
 * Retorna o status atual do estabelecimento baseado nos horários cadastrados.
 * @param horarios - Lista de horários de funcionamento (vindo do Supabase)
 * @returns Objeto com:
 *   - aberto: boolean (true se está aberto agora)
 *   - texto: string (mensagem amigável para exibir ao cliente)
 *   - exibir: boolean (se deve mostrar o indicador na interface)
 */
export function isEstabelecimentoAberto(horarios: Horario[]): {
  aberto: boolean;
  texto: string;
  exibir: boolean;
} {
  // Se não houver horários cadastrados, não exibe nada
  if (!horarios || horarios.length === 0) {
    return { aberto: false, texto: '', exibir: false };
  }

  const agora = new Date();
  const diaSemana = agora.getDay(); // 0-6
  const horaAtual = agora.getHours() * 60 + agora.getMinutes(); // minutos desde meia-noite

  // Um dia pode ter mais de um período (ex: almoço 11:00–15:00 e jantar
  // 18:00–22:00 — o editor de horários permite até 3 por dia). Antes o
  // código pegava só o primeiro período que batesse com o dia de hoje
  // (.find), então bastava cadastrar 2+ períodos pra um deles "esconder"
  // os outros e o status de aberto/fechado sair errado dependendo da
  // hora. Agora consideramos todos os períodos do dia.
  const periodosHoje = horarios.filter((h) => h.dia_semana === diaSemana);

  if (periodosHoje.length === 0 || periodosHoje.every((h) => h.fechado)) {
    return { aberto: false, texto: 'Fechado', exibir: true };
  }

  const paraMinutos = (horario: string | null | undefined, padrao: string) => {
    const [h, m] = (horario?.substring(0, 5) || padrao).split(':').map(Number);
    return h * 60 + m;
  };

  // Períodos abertos hoje, com abertura/fechamento já convertidos pra
  // minutos, ordenados por horário de abertura — pra podermos achar o
  // próximo horário de abertura caso esteja fechado agora.
  const periodos = periodosHoje
    .filter((h) => !h.fechado)
    .map((h) => ({
      aberturaMinutos: paraMinutos(h.horario_abertura, '08:00'),
      fechamentoMinutos: paraMinutos(h.horario_fechamento, '18:00'),
      horarioAberturaTexto: h.horario_abertura?.substring(0, 5) || '08:00',
    }))
    .sort((a, b) => a.aberturaMinutos - b.aberturaMinutos);

  // Está aberto se a hora atual cair dentro de QUALQUER um dos períodos
  const periodoAtual = periodos.find(
    (p) => horaAtual >= p.aberturaMinutos && horaAtual <= p.fechamentoMinutos
  );
  if (periodoAtual) {
    return { aberto: true, texto: 'Aberto agora', exibir: true };
  }

  // Fechado agora — se ainda vai abrir hoje (existe período com abertura
  // à frente do horário atual), mostra esse próximo horário
  const proximoPeriodo = periodos.find((p) => horaAtual < p.aberturaMinutos);
  if (proximoPeriodo) {
    return {
      aberto: false,
      texto: `Abre às ${proximoPeriodo.horarioAberturaTexto}`,
      exibir: true,
    };
  }

  // Já passou de todos os períodos de hoje
  return { aberto: false, texto: 'Fechado', exibir: true };
}