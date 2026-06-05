export function isEstabelecimentoAberto(horarios: any[]): { aberto: boolean; texto: string; exibir: boolean } {
  // Se não houver horários cadastrados, não exibe nada
  if (!horarios || horarios.length === 0) {
    return { aberto: false, texto: '', exibir: false }
  }

  const agora = new Date()
  const diaSemana = agora.getDay()
  const horaAtual = agora.getHours() * 60 + agora.getMinutes()

  const horarioHoje = horarios.find((h: any) => h.dia_semana === diaSemana)

  if (!horarioHoje || horarioHoje.fechado) {
    return { aberto: false, texto: 'Fechado', exibir: true }
  }

  const [hA, mA] = (horarioHoje.horario_abertura?.substring(0, 5) || '08:00').split(':').map(Number)
  const [hF, mF] = (horarioHoje.horario_fechamento?.substring(0, 5) || '18:00').split(':').map(Number)

  const aberturaMinutos = hA * 60 + mA
  const fechamentoMinutos = hF * 60 + mF

  if (horaAtual >= aberturaMinutos && horaAtual < fechamentoMinutos) {
    return { aberto: true, texto: 'Aberto agora', exibir: true }
  } else if (horaAtual < aberturaMinutos) {
    return { aberto: false, texto: `Abre às ${horarioHoje.horario_abertura?.substring(0, 5)}`, exibir: true }
  } else {
    return { aberto: false, texto: 'Fechado', exibir: true }
  }
}