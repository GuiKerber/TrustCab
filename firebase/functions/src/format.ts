// Formatação dos textos de notificação. Espelha mobile/src/lib (dates, money, vehicle, agendaText).

const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export type AgendaData = {
  connectionId: string;
  driverId: string;
  passengerId: string;
  status: string;
  kind: 'recurring' | 'single';
  weekdays: number[];
  date: string | null;
  time: string;
  origin: string;
  destination: string;
  note: string;
  price: number | null;
  proposedPrice: number | null;
  pendingChange: Record<string, unknown> | null;
  returnOf: string | null;
  endedBy?: string;
  endedByConnection?: boolean;
};

export type Card = {
  name: string;
  photoURL: string | null;
  phone: string | null;
  vehicle: { model: string; color: string; plate: string } | null;
  notificationsEnabled: boolean;
};

function weekdays(days: number[]) {
  const ordered = WEEK_ORDER.filter((d) => days.includes(d));
  if (ordered.length === 7) return 'todos os dias';
  const positions = ordered.map((d) => WEEK_ORDER.indexOf(d));
  const consecutive = positions.every((p, i) => i === 0 || p === positions[i - 1] + 1);
  if (ordered.length >= 3 && consecutive) {
    return `${WEEKDAY_SHORT[ordered[0]]} a ${WEEKDAY_SHORT[ordered[ordered.length - 1]]}`;
  }
  const names = ordered.map((d) => WEEKDAY_SHORT[d]);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

// Datas são chaves locais (AAAA-MM-DD); UTC evita que o fuso do servidor mude o dia.
export function day(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return `${WEEKDAY_SHORT[date.getUTCDay()]}, ${d} ${MONTH_SHORT[m - 1]}`;
}

export function when(agenda: Pick<AgendaData, 'kind' | 'weekdays' | 'date' | 'time'>) {
  const days = agenda.kind === 'single' && agenda.date ? day(agenda.date) : weekdays(agenda.weekdays);
  return `${days}, às ${agenda.time}`;
}

export function route(agenda: Pick<AgendaData, 'origin' | 'destination'>) {
  return `${agenda.origin} → ${agenda.destination}`;
}

export function price(cents: number | null | undefined) {
  if (cents == null) return 'sem valor combinado';
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

export function vehicle(card: Card | null | undefined) {
  const v = card?.vehicle;
  if (!v) return 'Veículo não informado';
  const plate = v.plate.length === 7 ? `${v.plate.slice(0, 3)}-${v.plate.slice(3)}` : v.plate;
  return `${v.model} ${v.color} · ${plate}`;
}

export function nameOf(card: Card | null | undefined, fallback: string) {
  return card?.name?.trim() || fallback;
}

export function truncate(text: string, max = 140) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
