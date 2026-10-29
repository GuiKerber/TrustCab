// Dados de exemplo do Storybook. As telas do app leem do Firestore (apps/driver/src/data/days.ts);
// o que sobra aqui é o material das stories, para o design system ser olhado sem conta e sem rede.
// Nomes, endereços e valores são fictícios.

// Ordem: agendada → a caminho da partida → chegou na partida → em viagem até o destino → concluída.
// Do lado do passageiro, antes de "agendada": pedida (esperando o motorista) e recusada.
export type TripStatus = 'requested' | 'declined' | 'scheduled' | 'on_the_way' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';

export type Trip = {
  id: string;
  time: string;
  // Quem é o passageiro. O nome serve para ler; é este id que agrupa dinheiro e histórico,
  // porque duas pessoas podem se chamar igual e o nome quem digita é o próprio passageiro.
  passengerId: string;
  passenger: string;
  // Quem dirige. O app do passageiro mostra em cada cartão, porque ele pode ter mais de um motorista.
  driver?: string;
  origin: string;
  destination: string;
  // O passageiro propõe o valor ao pedir; você aprova ou recusa o pedido com ele.
  priceCents: number;
  status: TripStatus;
};

export type Day = {
  date: Date;
  trips: Trip[];
};

export function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function isSameDay(a: Date, b: Date) {
  return dayKey(a) === dayKey(b);
}

export function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function trip(
  id: string,
  time: string,
  passenger: string,
  origin: string,
  destination: string,
  priceCents: number,
  status: TripStatus = 'scheduled',
): Trip {
  return { id, time, passengerId: passengerIdOf(passenger), passenger, origin, destination, priceCents, status };
}

function tripsFor(date: Date, today: Date): Trip[] {
  const weekday = date.getDay();
  const prefix = dayKey(date).replace(/-/g, '');
  const status: TripStatus = startOfDay(date) < startOfDay(today) ? 'completed' : 'scheduled';
  if (weekday === 0) return [];
  if (weekday === 6) {
    return [trip(`${prefix}-s`, '09:00', 'Ana Souza', 'Rua das Flores, 120', 'Academia Movimento', 1800, status)];
  }
  return [
    trip(`${prefix}-1`, '07:30', 'Ana Souza', 'Rua das Flores, 120', 'Av. Paulista, 1000', 2500, status),
    trip(`${prefix}-2`, '08:10', 'Júlia Rocha', 'Rua Harmonia, 45', 'Universidade, R. Maria Antônia', 2000, status),
    trip(`${prefix}-3`, '18:00', 'Ana Souza', 'Av. Paulista, 1000', 'Rua das Flores, 120', 2500, status),
  ];
}

function daysOfMonth(year: number, month: number, today: Date): Day[] {
  const total = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: total }, (_, i) => {
    const date = new Date(year, month, i + 1);
    return { date, trips: tripsFor(date, today) };
  });
}

// Nome do motorista nos exemplos (a chave Pix e o carro ficam em data/profile.ts).
export const driver = { firstName: 'Carlos' };

const nextTripTime = new Map<string, string>();

export const unreadChats = 2;

// Quem entra é sempre convidado por você. Ativo: aceitou o convite e já pode pedir viagens. Convidado: ainda não respondeu.
export type PassengerStatus = 'active' | 'invited';

export type Passenger = {
  id: string;
  name: string;
  phone: string;
  status: PassengerStatus;
  // Ativo: desde quando está na sua rede. Convidado: quando você convidou.
  since: Date;
};

// Pedido de uma viagem. Cada viagem é aprovada ou recusada uma por uma: você pode não ter o horário livre em todos os dias.
export type TripRequest = {
  id: string;
  passengerId: string;
  passenger: string;
  date: Date;
  time: string;
  origin: string;
  destination: string;
  priceCents: number;
};

export function samplePassengers(now: Date): Passenger[] {
  const monthsAgo = (months: number, day: number) => new Date(now.getFullYear(), now.getMonth() - months, day);
  const daysAgo = (days: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
  return [
    { id: 'ana', name: 'Ana Souza', phone: '11987654321', status: 'active', since: monthsAgo(6, 24) },
    { id: 'julia', name: 'Júlia Rocha', phone: '11976543210', status: 'active', since: monthsAgo(6, 28) },
    { id: 'pedro', name: 'Pedro Lima', phone: '11965432109', status: 'active', since: daysAgo(2) },
    { id: 'marina', name: 'Marina Alves', phone: '11954321098', status: 'active', since: daysAgo(1) },
    { id: 'rafael', name: 'Rafael Costa', phone: '11943210987', status: 'invited', since: daysAgo(3) },
  ];
}

// Próximo dia da semana (0 = domingo) depois de hoje.
function nextWeekday(now: Date, weekday: number) {
  const date = startOfDay(now);
  date.setDate(date.getDate() + (((weekday - date.getDay() + 7) % 7) || 7));
  return date;
}

// Id do passageiro a partir do nome (as viagens guardam o nome). Convidados novos usam o primeiro nome.
export function passengerIdOf(name: string) {
  return samplePassengers(new Date()).find((p) => p.name === name)?.id ?? name.toLowerCase().split(' ')[0];
}

export function sampleTripRequests(now: Date): TripRequest[] {
  const pedro = { passengerId: 'pedro', passenger: 'Pedro Lima', time: '08:00', origin: 'Rua Augusta, 500', destination: 'Av. Faria Lima, 3000', priceCents: 2800 };
  return [
    { id: 'pedido-pedro-seg', date: nextWeekday(now, 1), ...pedro },
    { id: 'pedido-pedro-qua', date: nextWeekday(now, 3), ...pedro },
    { id: 'pedido-pedro-sex', date: nextWeekday(now, 5), ...pedro },
    {
      id: 'pedido-marina-qui',
      passengerId: 'marina',
      passenger: 'Marina Alves',
      date: nextWeekday(now, 4),
      time: '19:30',
      origin: 'Shopping Iguatemi',
      destination: 'Rua Oscar Freire, 200',
      priceCents: 3500,
    },
  ];
}

export function sampleMonth(now: Date) {
  const todayKey = dayKey(now);
  const days = daysOfMonth(now.getFullYear(), now.getMonth(), now);

  // A próxima viagem de hoje começa daqui a pouco, para os botões de aviso aparecerem liberados.
  const today = days.find((day) => dayKey(day.date) === todayKey);
  if (today) {
    // O horário é calculado uma vez por dia, para a home e a tela de Ganhos mostrarem o mesmo.
    let time = nextTripTime.get(todayKey);
    if (!time) {
      const soon = new Date(now.getTime() + 35 * 60_000);
      soon.setMinutes(Math.ceil(soon.getMinutes() / 5) * 5, 0, 0);
      time = `${String(soon.getHours()).padStart(2, '0')}:${String(soon.getMinutes()).padStart(2, '0')}`;
      nextTripTime.set(todayKey, time);
    }
    const extra = trip('hoje-proxima', time, 'Ana Souza', 'Av. Paulista, 1000', 'Clínica Bem-Estar, R. Augusta', 3000);
    const done = today.trips.map((t): Trip => (t.time < time ? { ...t, status: 'completed' } : t));
    today.trips = [...done, extra].sort((a, b) => a.time.localeCompare(b.time));
  }

  const monday = startOfDay(new Date(now));
  monday.setDate(monday.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const weekEarnings = days
    .filter((day) => day.date >= monday && day.date <= sunday)
    .flatMap((day) => day.trips)
    .filter((t) => t.status !== 'cancelled')
    .reduce((sum, t) => sum + t.priceCents, 0);

  return {
    days,
    weekEarnings,
    driverFirstName: driver.firstName,
    unreadChats,
  };
}

export type MonthHistory = { month: Date; days: Day[] };

// Dias de qualquer mês; o mês atual é igual ao da home (com a próxima viagem de hoje).
export function sampleMonthDays(month: Date, now: Date): Day[] {
  if (month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth()) return sampleMonth(now).days;
  return daysOfMonth(month.getFullYear(), month.getMonth(), now);
}

// Histórico para a tela de Ganhos: os meses anteriores e o atual (o atual igual ao da home).
export function sampleHistory(now: Date, count = 6): MonthHistory[] {
  return Array.from({ length: count }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    const days = i === count - 1 ? sampleMonth(now).days : daysOfMonth(month.getFullYear(), month.getMonth(), now);
    return { month, days };
  });
}

export function formatPrice(cents: number) {
  const [whole, decimals] = (cents / 100).toFixed(2).split('.');
  return `R$ ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${decimals}`;
}

// (11) 98765-4321, também enquanto a pessoa digita.
export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, digits.length - 4)}-${digits.slice(-4)}`;
}

export function formatPriceShort(cents: number) {
  return `R$ ${String(Math.round(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const WEEKDAY = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

export const WEEKDAY_INITIAL = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

export function monthName(date: Date) {
  return MONTHS[date.getMonth()];
}

export function weekdayShort(date: Date) {
  return WEEKDAY[date.getDay()].slice(0, 3);
}

export function fullDate(date: Date) {
  return `${WEEKDAY[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

export function longDate(date: Date) {
  return `${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

export function shortDate(date: Date) {
  return `${date.getDate()} de ${MONTHS[date.getMonth()].slice(0, 3)}`;
}

// Título do dia na Home. Só dia da semana, nunca data: a Home mostra uma semana,
// e dentro de sete dias o nome do dia não tem ambiguidade. Datas ("Sex, 23/10") eram
// longas demais e obrigavam o título a trocar de tamanho, quebrando a tipografia.
const WEEKDAY_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function weekdayTitle(date: Date, now: Date) {
  const diff = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / 86_400_000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Ontem';
  return WEEKDAY_FULL[date.getDay()];
}

export function relativeDay(date: Date, now: Date) {
  const diff = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / 86_400_000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Ontem';
  const weekday = WEEKDAY[date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${weekday[0].toUpperCase()}${weekday.slice(1)}, ${day}/${month}`;
}
