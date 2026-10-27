import { doc, orderBy, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';

import { db } from './client';
import { useCollection, useDoc, type Live } from './live';
import {
  connectionId,
  tripId,
  type AgendaDoc,
  type AgendaFields,
  type ConnectionDoc,
  type MessageDoc,
  type Pix,
  type TripDoc,
  type TripStatus,
  type UserDoc,
  type Vehicle,
} from './types';

// ─── Leituras ao vivo ────────────────────────────────────────────────────────

export function useUser(uid: string | null) {
  return useDoc<UserDoc>(uid ? `users/${uid}` : null);
}

// As conexões de quem está logado. O papel decide por qual campo procurar.
export function useConnections(uid: string | null, role: 'driver' | 'passenger'): Live<(ConnectionDoc & { id: string })[]> {
  const field = role === 'driver' ? 'driverId' : 'passengerId';
  return useCollection<ConnectionDoc>(uid ? 'connections' : null, [where(field, '==', uid)], `conn:${role}:${uid}`);
}

// Agendas de uma conexão, ou de todas as conexões da pessoa.
export function useAgendas(uid: string | null, role: 'driver' | 'passenger'): Live<(AgendaDoc & { id: string })[]> {
  const field = role === 'driver' ? 'driverId' : 'passengerId';
  return useCollection<AgendaDoc>(uid ? 'agendas' : null, [where(field, '==', uid)], `ag:${role}:${uid}`);
}

// Viagens de um intervalo de datas. As datas são strings AAAA-MM-DD, que ordenam sozinhas.
export function useTrips(uid: string | null, role: 'driver' | 'passenger', from: string, to: string) {
  const field = role === 'driver' ? 'driverId' : 'passengerId';
  return useCollection<TripDoc>(
    uid ? 'trips' : null,
    [where(field, '==', uid), where('date', '>=', from), where('date', '<=', to)],
    `trip:${role}:${uid}:${from}:${to}`,
  );
}

export function useMessages(connId: string | null) {
  return useCollection<MessageDoc>(
    connId ? `connections/${connId}/messages` : null,
    [orderBy('createdAt', 'asc')],
    `msg:${connId}`,
  );
}

// ─── Escritas ────────────────────────────────────────────────────────────────
// Cada uma espelha exatamente um caminho permitido nas regras. Se a forma não bater,
// o Firestore recusa — por isso elas são finas e específicas, não genéricas.

function need() {
  if (!db) throw new Error('Firestore não configurado');
  return db;
}

// Primeiro acesso: cria o perfil. "role" nunca muda depois.
export function createUser(uid: string, data: Pick<UserDoc, 'role' | 'name' | 'email' | 'photoURL' | 'termsVersion'>) {
  return setDoc(doc(need(), `users/${uid}`), {
    ...data,
    phone: null,
    vehicle: null,
    pix: null,
    fcmTokens: [],
    notificationsEnabled: true,
    termsAcceptedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
}

// Carro e Pix do motorista: a Function onUserUpdated espalha para as conexões dele.
export function setVehicle(uid: string, vehicle: Vehicle | null) {
  return updateDoc(doc(need(), `users/${uid}`), { vehicle });
}

export function setPix(uid: string, pix: Pix | null) {
  return updateDoc(doc(need(), `users/${uid}`), { pix });
}

export function setPhone(uid: string, phone: string | null) {
  return updateDoc(doc(need(), `users/${uid}`), { phone });
}

export function setNotificationsEnabled(uid: string, on: boolean) {
  return updateDoc(doc(need(), `users/${uid}`), { notificationsEnabled: on });
}

// Passageiro entra pelo link: a conexão nasce "pending" e o motorista decide.
export function requestConnection(driverId: string, passengerId: string, inviteToken: string) {
  return setDoc(doc(need(), `connections/${connectionId(driverId, passengerId)}`), {
    driverId,
    passengerId,
    status: 'pending',
    inviteToken,
    unread: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function answerConnection(id: string, status: 'active' | 'declined') {
  return updateDoc(doc(need(), `connections/${id}`), { status, updatedAt: serverTimestamp() });
}

export function endConnection(id: string, uid: string) {
  return updateDoc(doc(need(), `connections/${id}`), { status: 'ended', endedBy: uid, updatedAt: serverTimestamp() });
}

// Passageiro pede o combinado. É aprovado uma vez; os dias saem dele.
export function requestAgenda(
  id: string,
  base: { connectionId: string; driverId: string; passengerId: string; startDate: string },
  fields: AgendaFields,
) {
  return setDoc(doc(need(), `agendas/${id}`), {
    ...base,
    ...fields,
    status: 'requested',
    proposedPrice: null,
    pendingChange: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function answerAgenda(id: string, status: 'confirmed' | 'declined') {
  return updateDoc(doc(need(), `agendas/${id}`), { status, updatedAt: serverTimestamp() });
}

// Motorista propõe outro valor; o passageiro aceita e o valor entra no combinado.
export function proposePrice(id: string, proposedPrice: number) {
  return updateDoc(doc(need(), `agendas/${id}`), { status: 'awaiting_passenger', proposedPrice, updatedAt: serverTimestamp() });
}

export function acceptPrice(id: string, price: number) {
  return updateDoc(doc(need(), `agendas/${id}`), { status: 'confirmed', price, proposedPrice: null, updatedAt: serverTimestamp() });
}

export function endAgenda(id: string, uid: string) {
  return updateDoc(doc(need(), `agendas/${id}`), { status: 'ended', endedBy: uid, updatedAt: serverTimestamp() });
}

// O dia da viagem. O documento só nasce quando alguém age: antes disso o dia é calculado
// a partir da agenda. Por isso é setDoc com merge, e não create.
const STAMP: Record<TripStatus, string> = {
  on_the_way: 'onTheWayAt',
  arrived: 'arrivedAt',
  completed: 'completedAt',
  cancelled: 'cancelledAt',
};

export function setTripStatus(
  base: { agendaId: string; connectionId: string; driverId: string; passengerId: string; date: string; time: string },
  status: TripStatus,
  by: string,
) {
  return setDoc(
    doc(need(), `trips/${tripId(base.agendaId, base.date)}`),
    {
      ...base,
      status,
      cancelledBy: status === 'cancelled' ? by : null,
      [STAMP[status]]: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function sendMessage(connId: string, senderId: string, text: string) {
  const id = doc(need(), `connections/${connId}/messages`).id;
  return setDoc(doc(need(), `connections/${connId}/messages/${id}`), {
    type: 'text',
    senderId,
    text,
    createdAt: serverTimestamp(),
  });
}

// Aviso automático da viagem: vira push pela Function onTripNotice.
export function sendNotice(connId: string, senderId: string, text: string, event: string, push: { title: string; body: string }) {
  const id = doc(need(), `connections/${connId}/messages`).id;
  return setDoc(doc(need(), `connections/${connId}/messages/${id}`), {
    type: 'notice',
    senderId,
    text,
    event,
    push,
    createdAt: serverTimestamp(),
  });
}
