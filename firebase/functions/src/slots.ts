// Cópia da conta de horários de packages/core/src/slots.ts. A Function não compartilha
// node_modules com os apps (ela é publicada sozinha), e o projeto já duplica assim em format.ts.
// Quando mudar um lado, mude o outro: é a página de agendamento e o app do motorista dizendo a
// mesma coisa sobre o mesmo horário.

export const TIMEZONE = 'America/Sao_Paulo';
export const BOOKING_HORIZON_DAYS = 21;

export type Slots = {
  weekdays: number[];
  from: string;
  to: string;
  stepMinutes: number;
  seats: number;
};

export const defaultSlots: Slots = { weekdays: [1, 2, 3, 4, 5], from: '06:00', to: '20:00', stepMinutes: 30, seats: 1 };

export const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
export const WEEKDAY_LONG = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
export const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const MONTH_LONG = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function readSlots(raw: unknown): Slots {
  const s = (raw ?? {}) as Partial<Slots>;
  const weekdays = Array.isArray(s.weekdays) ? s.weekdays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) : [];
  return {
    weekdays: weekdays.length > 0 ? weekdays : defaultSlots.weekdays,
    from: isValidTime(s.from ?? '') ? s.from! : defaultSlots.from,
    to: isValidTime(s.to ?? '') ? s.to! : defaultSlots.to,
    stepMinutes: [15, 30, 60].includes(Number(s.stepMinutes)) ? Number(s.stepMinutes) : defaultSlots.stepMinutes,
    seats: Number.isInteger(s.seats) && s.seats! >= 1 && s.seats! <= 10 ? s.seats! : defaultSlots.seats,
  };
}

export function todayISO(now: Date = new Date(), timeZone: string = TIMEZONE) {
  const parts = new Intl.DateTimeFormat('pt-BR', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function nowTime(now: Date = new Date(), timeZone: string = TIMEZONE) {
  const parts = new Intl.DateTimeFormat('pt-BR', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(now);
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

export function shortDate(iso: string) {
  const [, m, d] = iso.split('-').map(Number);
  return `${WEEKDAY_SHORT[weekdayOf(iso)]}, ${d} de ${MONTH_SHORT[m - 1]}`;
}

export function longDate(iso: string) {
  const [, m, d] = iso.split('-').map(Number);
  return `${WEEKDAY_LONG[weekdayOf(iso)]}, ${d} de ${MONTH_LONG[m - 1]}`;
}

export function weekdayList(weekdays: number[]) {
  const names = [...weekdays].sort().map((d) => WEEKDAY_LONG[d].replace('-feira', ''));
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

export function minutesOf(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function timeOf(minutes: number) {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function slotTimes(slots: Slots) {
  const step = Math.max(15, slots.stepMinutes);
  const start = minutesOf(slots.from);
  const end = minutesOf(slots.to);
  const times: string[] = [];
  for (let m = start; m <= end && times.length < 96; m += step) times.push(timeOf(m));
  return times;
}

export function nextDates(slots: Slots, fromISO: string, horizon = BOOKING_HORIZON_DAYS) {
  const days: string[] = [];
  for (let i = 0; i <= horizon; i += 1) {
    const iso = addDays(fromISO, i);
    if (slots.weekdays.includes(weekdayOf(iso))) days.push(iso);
  }
  return days;
}

export type Occupancy = {
  weekly: Record<string, number>;
  dated: Record<string, number>;
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

export function takenAt(o: Occupancy, date: string, time: string) {
  const key = weeklyKey(weekdayOf(date), time);
  const weekly = o.weekly[key] ?? 0;
  const from = o.weeklyFrom[key];
  const recurring = weekly > 0 && (!from || date >= from) ? weekly : 0;
  return Math.max(0, recurring + (o.dated[datedKey(date, time)] ?? 0));
}

export function freeAt(o: Occupancy, slots: Slots, date: string, time: string) {
  return Math.max(0, slots.seats - takenAt(o, date, time));
}

export function freeWeekly(o: Occupancy, slots: Slots, weekday: number, time: string) {
  return Math.max(0, slots.seats - (o.weekly[weeklyKey(weekday, time)] ?? 0));
}

export function isPast(date: string, time: string, todayIso: string, nowHHMM: string) {
  if (date < todayIso) return true;
  return date === todayIso && minutesOf(time) <= minutesOf(nowHHMM);
}
