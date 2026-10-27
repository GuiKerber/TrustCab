// Horários do motorista e o que já está ocupado. É isto que a página de agendamento usa para
// mostrar um horário como livre ou cheio, e o app do motorista para desenhar a semana dele.
// Uma cópia desta conta vive em firebase/functions/src/slots.ts: quem renderiza a página é a
// Function, e ela não compartilha node_modules com os apps.

// Fuso do produto. O Brasil não tem mais horário de verão, mas a conta sai do fuso e não de um
// deslocamento fixo — assim Acre e Fernando de Noronha também batem.
export const TIMEZONE = 'America/Sao_Paulo';

// Quantos dias para frente a página oferece num pedido de dia único.
export const BOOKING_HORIZON_DAYS = 21;

export type Slots = {
  // Dias em que ele roda. 0 = domingo.
  weekdays: number[];
  // Janela de atendimento, hora local.
  from: string;
  to: string;
  // De quanto em quanto tempo os horários aparecem na página.
  stepMinutes: number;
  // Quantas pessoas ele leva no mesmo horário. Começa em 1 de propósito: errar para baixo ele vê
  // na hora (o horário aparece cheio e ele aumenta); errar para cima vira dois passageiros
  // marcados no mesmo lugar sem ninguém perceber.
  seats: number;
};

export const defaultSlots: Slots = {
  weekdays: [1, 2, 3, 4, 5],
  from: '06:00',
  to: '20:00',
  stepMinutes: 30,
  seats: 1,
};

export const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'] as const;
export const WEEKDAY_LONG = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
] as const;
export const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const;
export const MONTH_LONG = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const;

// ─── Datas em AAAA-MM-DD ─────────────────────────────────────────────────────
// A data é texto de calendário, não instante: "2026-11-03" é o dia 3 esteja o servidor onde
// estiver. As contas passam por UTC só para não pular um dia na virada do mês.

export function todayISO(now: Date = new Date(), timeZone: string = TIMEZONE) {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

// Hora local no fuso do produto, em HH:MM.
export function nowTime(now: Date = new Date(), timeZone: string = TIMEZONE) {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('hour')}:${get('minute')}`;
}

export function isValidDate(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function isValidTime(time: string) {
  return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

export function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function weekdayOf(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// Quantos dias de "from" até "to". Negativo quando "to" já passou.
export function daysBetween(from: string, to: string) {
  const at = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((at(to) - at(from)) / 86_400_000);
}

// "ter, 3 de nov"
export function dayShort(iso: string) {
  const [, m, d] = iso.split('-').map(Number);
  return `${WEEKDAY_SHORT[weekdayOf(iso)]}, ${d} de ${MONTH_SHORT[m - 1]}`;
}

// "terça-feira, 3 de novembro"
export function dayLong(iso: string) {
  const [, m, d] = iso.split('-').map(Number);
  return `${WEEKDAY_LONG[weekdayOf(iso)]}, ${d} de ${MONTH_LONG[m - 1]}`;
}

// "Toda segunda, quarta e sexta"
export function weekdayList(weekdays: number[]) {
  const names = [...weekdays].sort().map((d) => WEEKDAY_LONG[d].replace('-feira', ''));
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

// ─── Horários ────────────────────────────────────────────────────────────────

export function minutesOf(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function timeOf(minutes: number) {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

// Todos os horários que a página oferece, do início ao fim da janela.
export function slotTimes(slots: Slots) {
  const step = Math.max(15, slots.stepMinutes);
  const start = minutesOf(slots.from);
  const end = minutesOf(slots.to);
  const times: string[] = [];
  for (let m = start; m <= end && times.length < 96; m += step) times.push(timeOf(m));
  return times;
}

// Os próximos dias em que ele roda, a partir de uma data.
export function nextDates(slots: Slots, fromISO: string, horizon = BOOKING_HORIZON_DAYS) {
  const days: string[] = [];
  for (let i = 0; i <= horizon; i += 1) {
    const iso = addDays(fromISO, i);
    if (slots.weekdays.includes(weekdayOf(iso))) days.push(iso);
  }
  return days;
}

// ─── Ocupação ────────────────────────────────────────────────────────────────
// Duas contas: o que acontece toda semana (agenda recorrente) e o que é de um dia só. A chave é
// plana para a ocupação inteira viajar dentro da página, sem uma segunda consulta.

export type Occupancy = {
  // '1|07:00' → vagas ocupadas naquele dia da semana
  weekly: Record<string, number>;
  // '2026-11-03|07:00' → ocupação só daquela data (pedido de dia único, ou folga de uma viagem cancelada)
  dated: Record<string, number>;
  // Dia em que cada recorrente começa a valer, por chave semanal
  weeklyFrom: Record<string, string>;
};

export const emptyOccupancy = (): Occupancy => ({ weekly: {}, dated: {}, weeklyFrom: {} });

export const weeklyKey = (weekday: number, time: string) => `${weekday}|${time}`;
export const datedKey = (date: string, time: string) => `${date}|${time}`;

export function addWeekly(o: Occupancy, weekday: number, time: string, startDate: string, count = 1) {
  const key = weeklyKey(weekday, time);
  o.weekly[key] = (o.weekly[key] ?? 0) + count;
  const current = o.weeklyFrom[key];
  if (!current || startDate < current) o.weeklyFrom[key] = startDate;
}

export function addDated(o: Occupancy, date: string, time: string, count = 1) {
  const key = datedKey(date, time);
  o.dated[key] = (o.dated[key] ?? 0) + count;
}

// Quantas vagas estão tomadas numa data e horário.
export function takenAt(o: Occupancy, date: string, time: string) {
  const key = weeklyKey(weekdayOf(date), time);
  const weekly = o.weekly[key] ?? 0;
  const from = o.weeklyFrom[key];
  // A recorrente só conta a partir do dia em que ela começa.
  const recurring = weekly > 0 && (!from || date >= from) ? weekly : 0;
  return Math.max(0, recurring + (o.dated[datedKey(date, time)] ?? 0));
}

export function freeAt(o: Occupancy, slots: Slots, date: string, time: string) {
  return Math.max(0, slots.seats - takenAt(o, date, time));
}

// Um horário recorrente só entra se o dia da semana estiver livre em todas as semanas.
export function freeWeekly(o: Occupancy, slots: Slots, weekday: number, time: string) {
  return Math.max(0, slots.seats - (o.weekly[weeklyKey(weekday, time)] ?? 0));
}

// Horário que já passou não pode ser pedido.
export function isPast(date: string, time: string, todayIso: string, nowHHMM: string) {
  if (date < todayIso) return true;
  return date === todayIso && minutesOf(time) <= minutesOf(nowHHMM);
}

export function isOffered(slots: Slots, time: string) {
  return slotTimes(slots).includes(time);
}
