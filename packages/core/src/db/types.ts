// Formato dos documentos no Firestore. Isto não é desenho novo: é a tradução literal de
// firebase/firestore.rules, que já valida cada campo no servidor. Se estes tipos e as regras
// discordarem, quem ganha é a regra — a escrita simplesmente é recusada.

export type Role = 'driver' | 'passenger';

export type PixType = 'cpf' | 'phone' | 'email' | 'random';
export type Pix = { type: PixType; key: string };
export type Vehicle = { model: string; color: string; plate: string };

export type UserDoc = {
  role: Role;
  name: string;
  email: string;
  photoURL: string | null;
  phone: string | null;
  // Só o motorista tem carro e Pix; as regras recusam nos outros.
  vehicle: Vehicle | null;
  pix: Pix | null;
  fcmTokens: string[];
  notificationsEnabled: boolean;
  termsVersion: number;
  termsAcceptedAt: unknown;
  createdAt: unknown;
};

// O "cartão" de uma pessoa copiado para dentro da conexão pela Function onUserUpdated.
// É o que o outro lado lê sem precisar ler o perfil inteiro de alguém.
export type PersonCard = {
  uid: string;
  name: string;
  photoURL: string | null;
  phone: string | null;
  vehicle?: Vehicle | null;
  pix?: Pix | null;
};

export type ConnectionStatus = 'pending' | 'active' | 'declined' | 'ended';

export type ConnectionDoc = {
  driverId: string;
  passengerId: string;
  status: ConnectionStatus;
  inviteToken: string;
  // Não lidas por pessoa: { [uid]: número }.
  unread: Record<string, number>;
  endedBy?: string;
  driver?: PersonCard;
  passenger?: PersonCard;
  createdAt: unknown;
  updatedAt: unknown;
};

export type MessageDoc = {
  type: 'text' | 'notice';
  senderId: string;
  text: string;
  event?: string;
  push?: { title: string; body: string };
  createdAt: unknown;
  readAt?: unknown;
};

export type AgendaStatus = 'requested' | 'awaiting_passenger' | 'confirmed' | 'declined' | 'ended';

// Os campos do combinado em si. Viram também o "pendingChange" quando alguém pede alteração.
export type AgendaFields = {
  kind: 'recurring' | 'single';
  // 0 = domingo. Vazio quando kind = 'single'.
  weekdays: number[];
  // AAAA-MM-DD quando kind = 'single'; null quando é recorrente.
  date: string | null;
  time: string;
  origin: string;
  destination: string;
  note: string;
  price: number | null;
};

export type AgendaDoc = AgendaFields & {
  connectionId: string;
  driverId: string;
  passengerId: string;
  status: AgendaStatus;
  proposedPrice: number | null;
  pendingChange: AgendaFields | null;
  startDate: string;
  returnOf?: string | null;
  endedBy?: string;
  createdAt: unknown;
  updatedAt: unknown;
};

// Uma viagem é um dia de uma agenda. Só existe quando sai do combinado: antes disso
// o dia é calculado a partir da agenda, sem documento nenhum.
export type TripStatus = 'on_the_way' | 'arrived' | 'completed' | 'cancelled';

export type TripDoc = {
  agendaId: string;
  connectionId: string;
  driverId: string;
  passengerId: string;
  date: string;
  time: string;
  status: TripStatus;
  cancelledBy: string | null;
  onTheWayAt?: unknown;
  arrivedAt?: unknown;
  completedAt?: unknown;
  cancelledAt?: unknown;
  updatedAt: unknown;
};

export type InviteDoc = {
  active: boolean;
  driverId: string;
  driver?: PersonCard;
};

// id da conexão e da viagem são derivados, nunca sorteados: as regras conferem a conta.
export const connectionId = (driverId: string, passengerId: string) => `${driverId}_${passengerId}`;
export const tripId = (agendaId: string, date: string) => `${agendaId}_${date}`;
