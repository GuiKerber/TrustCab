import { formatPrice, startOfDay } from './sample';

// Máscaras dos campos e a conta das datas de uma rotina. Iguais nos dois apps.

// "730" → "07:30"; aceita só números enquanto a pessoa digita.
export function maskTime(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, digits.length - 2).padStart(2, '0')}:${digits.slice(-2)}`;
}

// null = horário válido.
export function timeError(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return 'Use o formato 07:30.';
  if (Number(match[1]) > 23 || Number(match[2]) > 59) return 'Esse horário não existe. Use de 00:00 a 23:59.';
  return null;
}

// "2500" → "R$ 25,00" (os dois últimos números são os centavos).
export function maskMoney(value: string) {
  const digits = value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 7);
  return digits ? formatPrice(Number(digits)) : '';
}

export function moneyToCents(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

// Quando uma rotina vale: só o mês atual, só o próximo ou todo mês (renova sozinha até ser parada).
export type RoutineSpan = 'thisMonth' | 'nextMonth' | 'everyMonth';

// Datas da rotina no período, a partir de amanhã. "Todo mês" gera o mês atual e o próximo;
// os seguintes entram na renovação, no começo de cada mês.
export function routineDates(weekdays: number[], span: RoutineSpan, now: Date) {
  const tomorrow = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const months = span === 'thisMonth' ? [0] : span === 'nextMonth' ? [1] : [0, 1];
  return months.flatMap((offset) => {
    const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const total = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    return Array.from({ length: total }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1)).filter(
      (date) => date >= tomorrow && weekdays.includes(date.getDay()),
    );
  });
}
