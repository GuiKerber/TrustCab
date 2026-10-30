// Dados só para as stories de teste de limite (não entram no app).

// Endereços reais e longos de lugares públicos de São Paulo, para ver se cartões e folhas quebram.
export const LONG_ADDRESSES = {
  hospital: 'Avenida Doutor Enéas de Carvalho Aguiar, 255 - Cerqueira César, São Paulo - SP, 05403-000',
  shopping: 'Avenida Presidente Juscelino Kubitschek, 2041 - Vila Nova Conceição, São Paulo - SP, 04543-011',
  einstein: 'Avenida Albert Einstein, 627 - Morumbi, São Paulo - SP, 05652-900',
  airport: 'Avenida Washington Luís, s/nº - Vila Congonhas, São Paulo - SP, 04626-911',
} as const;

// Horário "HH:MM" daqui a alguns minutos, para as stories de bloqueio por horário.
export function timeIn(minutes: number, from = new Date()) {
  const at = new Date(from.getTime() + minutes * 60_000);
  return `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
}
