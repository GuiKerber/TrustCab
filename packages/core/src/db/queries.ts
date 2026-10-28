import { addDoc, collection, deleteDoc, doc, orderBy, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { useMemo } from 'react';

import type { Plan } from '../plan';
import type { Slots } from '../slots';
import { db } from './client';
import { demoActive, demoData, isDemo } from './demo';
import { useCollection, useDoc, type Live } from './live';
import {
  chargeId,
  tripId,
  type AgendaDoc,
  type AgendaFields,
  type ChargeDoc,
  type PassengerDoc,
  type Pix,
  type TripDoc,
  type TripStatus,
  type UserDoc,
  type Vehicle,
} from './types';

// Leituras e escritas do app do motorista. Cada escrita espelha exatamente um caminho permitido
// em firebase/firestore.rules: se a forma não bater, o Firestore recusa. É por isso que elas são
// finas e específicas em vez de uma função genérica de salvar.
//
// O app nunca escreve em links nem em users.plan: o endereço público nasce na Function rotateLink
// e a data do plano é o que estamos cobrando.

// ─── Leituras ao vivo ────────────────────────────────────────────────────────
//
// Na sessão de demonstração não existe conta nem banco: cada leitura devolve o conjunto de
// exemplo e nenhuma escuta é aberta. O caminho vira null antes de chegar ao Firestore, e por
// isso a chamada do hook continua acontecendo sempre — a ordem dos hooks não pode variar.

const pronto = <T,>(data: T): Live<T> => ({ data, loading: false, error: null });

export function useUser(uid: string | null) {
  const live = useDoc<UserDoc>(uid && !isDemo(uid) ? `users/${uid}` : null);
  return isDemo(uid) ? pronto(demoData().user) : live;
}

// Os contatos do motorista.
export function usePassengers(uid: string | null): Live<(PassengerDoc & { id: string })[]> {
  const live = useCollection<PassengerDoc>(uid && !isDemo(uid) ? 'passengers' : null, [where('driverId', '==', uid)], `pax:${uid}`);
  return isDemo(uid) ? pronto(demoData().passengers) : live;
}

// Tudo o que ele combinou, em qualquer estado. A lista é pequena (uma por passageiro e trajeto)
// e serve a agenda, a home e a conta do mês de uma vez só.
export function useAgendas(uid: string | null): Live<(AgendaDoc & { id: string })[]> {
  const live = useCollection<AgendaDoc>(uid && !isDemo(uid) ? 'agendas' : null, [where('driverId', '==', uid)], `ag:${uid}`);
  return isDemo(uid) ? pronto(demoData().agendas) : live;
}

// A caixa de pedidos: o que chegou pelo link e ainda espera resposta, mais novo primeiro.
export function useRequests(uid: string | null): Live<(AgendaDoc & { id: string })[]> {
  const live = useCollection<AgendaDoc>(
    uid && !isDemo(uid) ? 'agendas' : null,
    [where('driverId', '==', uid), where('status', '==', 'requested'), orderBy('createdAt', 'desc')],
    `req:${uid}`,
  );
  return isDemo(uid) ? pronto(demoData().agendas.filter((a) => a.status === 'requested')) : live;
}

// Viagens de um intervalo. As datas são AAAA-MM-DD, que ordenam sozinhas.
export function useTrips(uid: string | null, from: string, to: string) {
  const live = useCollection<TripDoc>(
    uid && !isDemo(uid) ? 'trips' : null,
    [where('driverId', '==', uid), where('date', '>=', from), where('date', '<=', to)],
    `trip:${uid}:${from}:${to}`,
  );
  const demo = useMemo(() => (isDemo(uid) ? demoData().trips.filter((t) => t.date >= from && t.date <= to) : null), [uid, from, to]);
  return demo ? pronto(demo) : live;
}

// ─── Escritas ────────────────────────────────────────────────────────────────

function need() {
  if (!db) throw new Error('Firestore não configurado');
  return db;
}

// Na demonstração nada é gravado: não existe conta para assinar a escrita, e as regras do
// Firestore recusariam. A tela recebe sucesso para que o passo a passo continue navegável.
const fingeSucesso = () => demoActive();

// Primeiro acesso: cria o perfil. O plano entra zerado e quem põe a data do fim do teste é a
// Function onUserCreated — se o app pudesse escrevê-la, o teste nunca acabaria.
export function createUser(
  uid: string,
  data: Pick<UserDoc, 'name' | 'email' | 'photoURL' | 'termsVersion'>,
  slots: Slots,
) {
  if (fingeSucesso()) return Promise.resolve();
  return setDoc(doc(need(), `users/${uid}`), {
    ...data,
    phone: null,
    vehicle: null,
    pix: null,
    slug: null,
    slots,
    plan: { status: 'trial', until: null, source: 'none' } satisfies Plan,
    fcmTokens: [],
    notificationsEnabled: true,
    termsAcceptedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
}

export function setVehicle(uid: string, vehicle: Vehicle | null) {
  if (fingeSucesso()) return Promise.resolve();
  return updateDoc(doc(need(), `users/${uid}`), { vehicle });
}

export function setPix(uid: string, pix: Pix | null) {
  if (fingeSucesso()) return Promise.resolve();
  return updateDoc(doc(need(), `users/${uid}`), { pix });
}

export function setPhone(uid: string, phone: string | null) {
  if (fingeSucesso()) return Promise.resolve();
  return updateDoc(doc(need(), `users/${uid}`), { phone });
}

// Dias, janela e vagas: é o que a página de agendamento oferece a quem abre o link.
export function setSlots(uid: string, slots: Slots) {
  if (fingeSucesso()) return Promise.resolve();
  return updateDoc(doc(need(), `users/${uid}`), { slots });
}

export function setNotificationsEnabled(uid: string, on: boolean) {
  if (fingeSucesso()) return Promise.resolve();
  return updateDoc(doc(need(), `users/${uid}`), { notificationsEnabled: on });
}

// ─── Passageiros ─────────────────────────────────────────────────────────────

export function addPassenger(driverId: string, name: string, phone: string, note = '') {
  if (fingeSucesso()) return Promise.resolve();
  return addDoc(collection(need(), 'passengers'), {
    driverId,
    name,
    phone,
    note,
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function updatePassenger(id: string, data: Partial<Pick<PassengerDoc, 'name' | 'phone' | 'note' | 'archived'>>) {
  if (fingeSucesso()) return Promise.resolve();
  return updateDoc(doc(need(), `passengers/${id}`), { ...data, updatedAt: serverTimestamp() });
}

// ─── Agenda ──────────────────────────────────────────────────────────────────

// Responder ao pedido que veio do link. O valor é opcional: o acerto de preço acontece no
// WhatsApp, e aqui ele só registra o que ficou combinado.
export function answerRequest(id: string, status: 'confirmed' | 'declined', price: number | null = null) {
  if (fingeSucesso()) return Promise.resolve();
  return updateDoc(doc(need(), `agendas/${id}`), { status, price, updatedAt: serverTimestamp() });
}

// Combinado fechado na frente da pessoa: nasce confirmado, sem passar por pedido.
export function addAgenda(
  base: { driverId: string; passengerId: string; passengerName: string; passengerPhone: string; startDate: string },
  fields: AgendaFields,
) {
  if (fingeSucesso()) return Promise.resolve();
  return addDoc(collection(need(), 'agendas'), {
    ...base,
    ...fields,
    status: 'confirmed',
    source: 'driver',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// Corrigir o que já está confirmado: endereço errado, horário trocado, valor acertado depois.
export function updateAgenda(id: string, fields: AgendaFields) {
  if (fingeSucesso()) return Promise.resolve();
  return updateDoc(doc(need(), `agendas/${id}`), { ...fields, updatedAt: serverTimestamp() });
}

export function endAgenda(id: string, by: 'driver' | 'passenger') {
  if (fingeSucesso()) return Promise.resolve();
  return updateDoc(doc(need(), `agendas/${id}`), { status: 'ended', endedBy: by, updatedAt: serverTimestamp() });
}

// ─── Cobrança do mês ─────────────────────────────────────────────────────────

export function useCharges(uid: string | null): Live<(ChargeDoc & { id: string })[]> {
  const live = useCollection<ChargeDoc>(uid && !isDemo(uid) ? 'charges' : null, [where('driverId', '==', uid)], `chg:${uid}`);
  return isDemo(uid) ? pronto(demoData().charges) : live;
}

// Marcado quando ele abre o WhatsApp com a conta do mês escrita. Nós não sabemos se ele tocou em
// enviar — por isso a tela deixa desmarcar.
export function setChargeSent(
  base: { driverId: string; passengerId: string; month: string; totalCents: number; trips: number },
) {
  if (fingeSucesso()) return Promise.resolve();
  return setDoc(doc(need(), `charges/${chargeId(base.driverId, base.passengerId, base.month)}`), {
    ...base,
    sentAt: serverTimestamp(),
  });
}

export function clearChargeSent(driverId: string, passengerId: string, month: string) {
  if (fingeSucesso()) return Promise.resolve();
  return deleteDoc(doc(need(), `charges/${chargeId(driverId, passengerId, month)}`));
}

// ─── Viagem do dia ───────────────────────────────────────────────────────────
// O documento só nasce quando alguém age: antes disso o dia é calculado a partir da agenda.
// Por isso é setDoc com merge, e não create.

const STAMP: Record<TripStatus, string | null> = {
  scheduled: null,
  on_the_way: 'onTheWayAt',
  arrived: 'arrivedAt',
  in_progress: 'startedAt',
  completed: 'completedAt',
  cancelled: 'cancelledAt',
};

// Pago ou não pago. Separado do estado da viagem porque as duas coisas andam sozinhas: dá para
// concluir sem receber, e dá para receber antes de concluir.
export function setTripPaidAt(
  base: { agendaId: string; driverId: string; passengerId: string; date: string; time: string; price: number | null },
  paid: boolean,
) {
  if (fingeSucesso()) return Promise.resolve();
  return setDoc(
    doc(need(), `trips/${tripId(base.agendaId, base.date)}`),
    { ...base, paidAt: paid ? serverTimestamp() : null, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export function setTripStatus(
  base: { agendaId: string; driverId: string; passengerId: string; date: string; time: string; price: number | null },
  status: TripStatus,
  cancelledBy: 'driver' | 'passenger' | null = null,
) {
  if (fingeSucesso()) return Promise.resolve();
  return setDoc(
    doc(need(), `trips/${tripId(base.agendaId, base.date)}`),
    {
      ...base,
      status,
      cancelledBy: status === 'cancelled' ? (cancelledBy ?? 'driver') : null,
      ...(STAMP[status] ? { [STAMP[status]!]: serverTimestamp() } : {}),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
