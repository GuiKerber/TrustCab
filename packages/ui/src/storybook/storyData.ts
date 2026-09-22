// Dados só para as stories de teste de limite (não entram no app).

// Endereços reais e longos de lugares públicos de São Paulo, para ver se cartões e folhas quebram.
export const LONG_ADDRESSES = {
  hospital: 'Avenida Doutor Enéas de Carvalho Aguiar, 255 - Cerqueira César, São Paulo - SP, 05403-000',
  shopping: 'Avenida Presidente Juscelino Kubitschek, 2041 - Vila Nova Conceição, São Paulo - SP, 04543-011',
  einstein: 'Avenida Albert Einstein, 627 - Morumbi, São Paulo - SP, 05652-900',
  airport: 'Avenida Washington Luís, s/nº - Vila Congonhas, São Paulo - SP, 04626-911',
} as const;

// Mensagens compridas para o chat: um parágrafo longo e um link sem espaços.
export const LONG_MESSAGES = {
  paragraph:
    'Oi, Carlos! Amanhã eu preciso sair um pouco mais cedo porque tenho consulta no Hospital das Clínicas às 8h e depois vou direto para o trabalho, então se você puder me buscar às 07:10 em vez de 07:30 seria ótimo. Se não der, me avisa que eu vejo outra opção. Obrigada!',
  link: 'https://www.google.com/maps/dir/?api=1&destination=Avenida+Doutor+En%C3%A9as+de+Carvalho+Aguiar%2C+255+-+Cerqueira+C%C3%A9sar%2C+S%C3%A3o+Paulo',
} as const;

// Horário "HH:MM" daqui a alguns minutos, para as stories de bloqueio por horário.
export function timeIn(minutes: number, from = new Date()) {
  const at = new Date(from.getTime() + minutes * 60_000);
  return `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
}
