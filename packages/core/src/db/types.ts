// Formato dos documentos no Firestore. Isto não é desenho novo: é a tradução literal de
// firebase/firestore.rules, que já valida cada campo no servidor. Se estes tipos e as regras
// discordarem, quem ganha é a regra — a escrita simplesmente é recusada.
//
// Versão 2: só o motorista tem conta. O passageiro é um contato dele (passengers) e pede a agenda
// por uma página aberta por link, sem login. A versão 1 — com app, convite e conversa do passageiro
// — está na tag v1-app-passageiro.

import type { Plan } from '../plan';
import type { Slots } from '../slots';

export type PixType = 'cpf' | 'phone' | 'email' | 'random';
export type Pix = { type: PixType; key: string };
export type Vehicle = { model: string; color: string; plate: string };

export type UserDoc = {
  name: string;
  email: string;
  photoURL: string | null;
  // Obrigatório na versão 2: é o número que recebe o WhatsApp do passageiro.
  phone: string | null;
  vehicle: Vehicle | null;
  pix: Pix | null;
  // O link de agendamento dele. Nasce no servidor junto com o veículo.
  slug: string | null;
  // Dias, janela e vagas que a página oferece.
  slots: Slots;
  // Teste de 30 dias e assinatura. Só o servidor escreve.
  plan: Plan;
  fcmTokens: string[];
  notificationsEnabled: boolean;
  termsVersion: number;
  termsAcceptedAt: unknown;
  createdAt: unknown;
};

// O cartão do motorista que a página de agendamento mostra. É o único recorte público do perfil:
// nome, foto e carro. Telefone, Pix e e-mail nunca entram aqui.
export type DriverCard = {
  name: string;
  photoURL: string | null;
  vehicle: Vehicle | null;
};

// links/{slug}: o endereço público do motorista. Um por motorista, permanente até ele trocar.
export type LinkDoc = {
  driverId: string;
  active: boolean;
  driver: DriverCard;
  createdAt: unknown;
  revokedAt?: unknown;
};

// passengers/{id}: um contato do motorista. Não tem conta, não tem senha, não entra em lugar nenhum.
// Nasce quando alguém pede pelo link, ou quando o motorista cadastra à mão.
export type PassengerDoc = {
  driverId: string;
  name: string;
  // Só os dígitos: DDD + número.
  phone: string;
  note: string;
  // Fora da lista, sem apagar o histórico.
  archived: boolean;
  createdAt: unknown;
  updatedAt: unknown;
};

// requested → confirmed | declined; qualquer um dos dois lados encerra depois.
// A versão 1 tinha 'awaiting_passenger' e 'pendingChange' porque não havia canal de conversa.
// Agora a conversa é o WhatsApp: valor e mudança se resolvem lá e o motorista registra o que ficou.
export type AgendaStatus = 'requested' | 'confirmed' | 'declined' | 'ended';

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
  // Em centavos. null = ainda sem valor combinado.
  price: number | null;
};

export type AgendaDoc = AgendaFields & {
  driverId: string;
  passengerId: string;
  // Nome e telefone como estavam no pedido: a lista de pedidos não precisa de uma segunda leitura.
  passengerName: string;
  passengerPhone: string;
  status: AgendaStatus;
  // 'link' = veio da página; 'driver' = o motorista cadastrou pelo app.
  source: 'link' | 'driver';
  startDate: string;
  endedBy?: 'driver' | 'passenger';
  createdAt: unknown;
  updatedAt: unknown;
};

// Uma viagem é um dia de uma agenda. Só existe quando sai do combinado: antes disso o dia é
// calculado a partir da agenda, sem documento nenhum.
export type TripStatus = 'on_the_way' | 'arrived' | 'completed' | 'cancelled';

export type TripDoc = {
  agendaId: string;
  driverId: string;
  passengerId: string;
  date: string;
  time: string;
  status: TripStatus;
  cancelledBy: 'driver' | 'passenger' | null;
  // Em centavos, copiado da agenda quando a viagem é concluída: é o que fecha a conta do mês.
  price: number | null;
  onTheWayAt?: unknown;
  arrivedAt?: unknown;
  completedAt?: unknown;
  cancelledAt?: unknown;
  updatedAt: unknown;
};

// id da viagem é derivado, nunca sorteado: as regras conferem a conta.
export const tripId = (agendaId: string, date: string) => `${agendaId}_${date}`;

// Agendas que ocupam vaga na página: o que está combinado e o que ainda espera resposta.
// Um pedido sem resposta segura o horário — e aparece na caixa de pedidos do motorista com a
// data em que chegou, justamente para ele não deixar parado.
export const HOLDS_SEAT: AgendaStatus[] = ['requested', 'confirmed'];
