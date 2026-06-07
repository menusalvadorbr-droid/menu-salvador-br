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

  // Busca o horário para o dia atual
  const horarioHoje = horarios.find((h) => h.dia_semana === diaSemana);

  // Se não há horário cadastrado para hoje ou está marcado como fechado
  if (!horarioHoje || horarioHoje.fechado) {
    return { aberto: false, texto: 'Fechado', exibir: true };
  }

  // Converte horário de abertura para minutos
  const [hA, mA] = (horarioHoje.horario_abertura?.substring(0, 5) || '08:00')
    .split(':')
    .map(Number);
  const aberturaMinutos = hA * 60 + mA;

  // Converte horário de fechamento para minutos
  const [hF, mF] = (horarioHoje.horario_fechamento?.substring(0, 5) || '18:00')
    .split(':')
    .map(Number);
  const fechamentoMinutos = hF * 60 + mF;

  // Verifica se está dentro do horário de funcionamento
  if (horaAtual >= aberturaMinutos && horaAtual <= fechamentoMinutos) {
    return { aberto: true, texto: 'Aberto agora', exibir: true };
  } else if (horaAtual < aberturaMinutos) {
    // Ainda fechado, mas mostra o horário de abertura
    return {
      aberto: false,
      texto: `Abre às ${horarioHoje.horario_abertura?.substring(0, 5)}`,
      exibir: true,
    };
  } else {
    // Já fechou
    return { aberto: false, texto: 'Fechado', exibir: true };
  }
}