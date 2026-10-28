import { defaultSlots } from '../slots';
import type { AgendaDoc, ChargeDoc, PassengerDoc, TripDoc, UserDoc } from './types';
import { chargeId, tripId } from './types';

// O motorista de demonstração.
//
// A tela de login promete "navegue pelo app com dados de exemplo, sem criar conta". Isto é o que
// cumpre a promessa. E serve para uma segunda coisa: é o único jeito de ver o app cheio — dez
// passageiros, várias viagens no mesmo dia, meses de histórico — sem precisar de uma conta real
// com gente real dentro.
//
// Tudo aqui são documentos no mesmo formato do Firestore, de propósito: o que roda em cima deles
// é o aplicativo inteiro, sem desvio. Se o adaptador de dias tem um defeito com volume, ele
// aparece aqui igual apareceria em produção.
//
// Nada disto existe em produção: o portão é demoEnabled, que é __DEV__ ou EXPO_PUBLIC_DEMO=1.

export const DEMO_UID = 'demo-motorista';

// Ligado quando a pessoa entra pela porta "Ver sem conta". Enquanto estiver ligado, nenhuma
// escrita sai do aparelho: não existe conta para gravar e as regras recusariam de qualquer jeito.
let ativo = false;
export const setDemoActive = (on: boolean) => {
  ativo = on;
};
export const demoActive = () => ativo;
export const isDemo = (uid: string | null | undefined) => ativo && uid === DEMO_UID;

const iso = (date: Date) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 10);
};
const addDays = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

type Pessoa = { id: string; nome: string; phone: string; sai: string; volta: string | null; origem: string; destino: string; preco: number };

// Dez passageiros, com horários escalonados: às 07:00 há três pessoas, que é o caso que revela
// se a agenda do dia aguenta mais de uma viagem no mesmo horário.
const PESSOAS: Pessoa[] = [
  { id: 'ana', nome: 'Ana Souza', phone: '51991010101', sai: '06:30', volta: '18:00', origem: 'Rua das Flores, 120', destino: 'Av. Praia de Belas, 1181', preco: 2500 },
  { id: 'julia', nome: 'Júlia Rocha', phone: '51991020202', sai: '07:00', volta: '17:30', origem: 'Rua Harmonia, 45', destino: 'PUCRS, Av. Ipiranga 6681', preco: 2000 },
  { id: 'pedro', nome: 'Pedro Lima', phone: '51991030303', sai: '07:00', volta: null, origem: 'Rua Cel. Bordini, 600', destino: 'Hospital Moinhos de Vento', preco: 2200 },
  { id: 'marina', nome: 'Marina Alves', phone: '51991040404', sai: '07:00', volta: '18:30', origem: 'Av. Nilo Peçanha, 1600', destino: 'Shopping Iguatemi', preco: 1800 },
  { id: 'rafael', nome: 'Rafael Costa', phone: '51991050505', sai: '07:30', volta: null, origem: 'Rua Anita Garibaldi, 900', destino: 'Aeroporto Salgado Filho', preco: 4500 },
  { id: 'beatriz', nome: 'Beatriz Nunes', phone: '51991060606', sai: '07:30', volta: '19:00', origem: 'Rua Carlos Gomes, 300', destino: 'Centro, Rua da Praia', preco: 2800 },
  { id: 'caio', nome: 'Caio Ferreira', phone: '51991070707', sai: '08:00', volta: null, origem: 'Av. Protásio Alves, 2200', destino: 'UFRGS, Av. Paulo Gama', preco: 2100 },
  { id: 'daniela', nome: 'Daniela Prado', phone: '51991080808', sai: '08:00', volta: '17:30', origem: 'Rua Dr. Timóteo, 500', destino: 'Av. Carlos Gomes, 1340', preco: 1900 },
  { id: 'eduardo', nome: 'Eduardo Matos', phone: '51991090909', sai: '08:30', volta: null, origem: 'Rua Mariante, 288', destino: 'Av. Borges de Medeiros, 2500', preco: 2300 },
  { id: 'fernanda', nome: 'Fernanda Lima', phone: '51991101010', sai: '08:30', volta: '18:00', origem: 'Rua Felipe de Oliveira, 80', destino: 'Zona Norte, Av. Assis Brasil', preco: 3200 },
];

// Quem pediu e ainda espera resposta. Fica fora das agendas confirmadas de propósito: pedido não
// ocupa lugar na agenda do motorista até ele dizer sim.
const PEDINDO = [
  { id: 'gustavo', nome: 'Gustavo Reis', phone: '51991111111', time: '09:00', origem: 'Rua Vasco da Gama, 410', destino: 'Hospital de Clínicas', dias: [2, 4] },
  { id: 'helena', nome: 'Helena Barros', phone: '51991121212', time: '06:30', origem: 'Av. Cristóvão Colombo, 1500', destino: 'Rodoviária', dias: [] },
];

const UTEIS = [1, 2, 3, 4, 5];

export function demoUser(hoje: Date): UserDoc & { id: string } {
  return {
    id: DEMO_UID,
    name: 'Carlos Henrique',
    email: 'carlos@exemplo.com',
    photoURL: null,
    phone: '51991000000',
    vehicle: { model: 'Onix', color: 'prata', plate: 'ABC1D23' },
    pix: { type: 'random', key: '4e9f2a71-0c3b-4d58-9b12-7a6e5c81d340' },
    slug: 'carlos-demo99',
    slots: { ...defaultSlots, seats: 3 },
    plan: { status: 'trial', until: iso(addDays(hoje, 17)), source: 'none' },
    fcmTokens: [],
    notificationsEnabled: true,
    termsVersion: 3,
    termsAcceptedAt: null,
    createdAt: null,
  };
}

export function demoPassengers(hoje: Date): (PassengerDoc & { id: string })[] {
  const base = (id: string, nome: string, phone: string, diasAtras: number, archived = false) => ({
    id,
    driverId: DEMO_UID,
    name: nome,
    phone,
    note: '',
    archived,
    createdAt: { toDate: () => addDays(hoje, -diasAtras) },
    updatedAt: null,
  });
  return [
    ...PESSOAS.map((p, i) => base(p.id, p.nome, p.phone, 150 - i * 12)),
    ...PEDINDO.map((p, i) => base(p.id, p.nome, p.phone, 2 - i)),
    base('ex-passageiro', 'Otávio Dias', '51991131313', 300, true),
  ];
}

export function demoAgendas(hoje: Date): (AgendaDoc & { id: string })[] {
  const inicio = iso(addDays(hoje, -160));
  const comum = (p: { id: string; nome: string; phone: string }) => ({
    driverId: DEMO_UID,
    passengerId: p.id,
    passengerName: p.nome,
    passengerPhone: p.phone,
    source: 'link' as const,
    note: '',
    startDate: inicio,
    createdAt: null,
    updatedAt: null,
  });

  const confirmadas = PESSOAS.flatMap((p) => {
    const ida: AgendaDoc & { id: string } = {
      ...comum(p),
      id: `ag-${p.id}-ida`,
      status: 'confirmed',
      kind: 'recurring',
      weekdays: UTEIS,
      date: null,
      time: p.sai,
      origin: p.origem,
      destination: p.destino,
      price: p.preco,
    };
    if (!p.volta) return [ida];
    return [
      ida,
      {
        ...comum(p),
        id: `ag-${p.id}-volta`,
        status: 'confirmed' as const,
        kind: 'recurring' as const,
        weekdays: UTEIS,
        date: null,
        time: p.volta,
        origin: p.destino,
        destination: p.origem,
        price: p.preco,
      },
    ];
  });

  const pedidos = PEDINDO.map((p) => ({
    ...comum(p),
    id: `ag-${p.id}-pedido`,
    status: 'requested' as const,
    kind: (p.dias.length > 0 ? 'recurring' : 'single') as 'recurring' | 'single',
    weekdays: p.dias,
    date: p.dias.length > 0 ? null : iso(addDays(hoje, 2)),
    time: p.time,
    origin: p.origem,
    destination: p.destino,
    price: null,
    startDate: p.dias.length > 0 ? iso(hoje) : iso(addDays(hoje, 2)),
    createdAt: { toDate: () => addDays(hoje, 0) },
  }));

  return [...confirmadas, ...pedidos];
}

// As viagens que saíram do combinado: os dias passados, concluídos, e um punhado já pago.
// Os dias futuros não viram documento — eles são calculados a partir da agenda, como em produção.
export function demoTrips(hoje: Date): (TripDoc & { id: string })[] {
  const saida: (TripDoc & { id: string })[] = [];
  const agendas = demoAgendas(hoje).filter((a) => a.status === 'confirmed');

  for (let atras = 1; atras <= 70; atras += 1) {
    const dia = addDays(hoje, -atras);
    if (!UTEIS.includes(dia.getDay())) continue;
    const date = iso(dia);
    for (const a of agendas) {
      // Uma falta aqui e ali, para o histórico não parecer régua.
      const faltou = (dia.getDate() + a.time.charCodeAt(1)) % 23 === 0;
      saida.push({
        id: tripId(a.id, date),
        agendaId: a.id,
        driverId: DEMO_UID,
        passengerId: a.passengerId,
        date,
        time: a.time,
        status: faltou ? 'cancelled' : 'completed',
        cancelledBy: faltou ? 'passenger' : null,
        price: faltou ? null : a.price,
        // Quem paga na hora pelo QR Code sai da cobrança do mês.
        paidAt: !faltou && a.passengerId.charCodeAt(0) % 3 === 0 ? { toDate: () => dia } : undefined,
        completedAt: faltou ? undefined : { toDate: () => dia },
        cancelledAt: faltou ? { toDate: () => dia } : undefined,
        updatedAt: null,
      });
    }
  }
  return saida;
}

// Tudo de uma vez, calculado uma única vez por dia.
//
// A identidade destes arrays precisa ser estável: as telas memorizam a montagem dos dias pela
// identidade da lista de agendas, e gerar listas novas a cada render faria o app recalcular
// setenta dias de viagens sem parar.
let cache: { dia: string; dados: DemoData } | null = null;
export type DemoData = {
  user: UserDoc & { id: string };
  passengers: (PassengerDoc & { id: string })[];
  agendas: (AgendaDoc & { id: string })[];
  trips: (TripDoc & { id: string })[];
  charges: (ChargeDoc & { id: string })[];
};

export function demoData(): DemoData {
  const hoje = new Date();
  const dia = iso(hoje);
  if (cache?.dia === dia) return cache.dados;
  const dados: DemoData = {
    user: demoUser(hoje),
    passengers: demoPassengers(hoje),
    agendas: demoAgendas(hoje),
    trips: demoTrips(hoje),
    charges: demoCharges(hoje),
  };
  cache = { dia, dados };
  return dados;
}

// Um mês já fechado com uma pessoa, para a tela de Ganhos ter os dois estados.
export function demoCharges(hoje: Date): (ChargeDoc & { id: string })[] {
  const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  const month = `${mesPassado.getFullYear()}-${String(mesPassado.getMonth() + 1).padStart(2, '0')}`;
  return [
    {
      id: chargeId(DEMO_UID, 'ana', month),
      driverId: DEMO_UID,
      passengerId: 'ana',
      month,
      totalCents: 42500,
      trips: 17,
      sentAt: { toDate: () => new Date(hoje.getFullYear(), hoje.getMonth(), 2) },
    },
  ];
}
