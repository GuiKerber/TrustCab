import './setup';

import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { pushToUser } from './notify';
import { addDays, longDate, TIMEZONE, todayISO, weekdayList, weekdayOf } from './slots';

// Os avisos que saem sozinhos. São três, e todos vão para o motorista — o passageiro não tem app,
// e tudo o que chega nele sai do WhatsApp, pelo dedo de alguém.

function whenLabel(agenda: Record<string, unknown>) {
  if (agenda.kind === 'recurring') return `toda ${weekdayList((agenda.weekdays as number[]) ?? [])} às ${agenda.time}`;
  return agenda.date ? `${longDate(agenda.date as string)} às ${agenda.time}` : `às ${agenda.time}`;
}

// Pedido novo pelo link: é a notificação que faz o produto existir. Sem ela o motorista só
// descobre o pedido quando abre o app, e o passageiro fica esperando sem resposta.
export const onAgendaCreated = onDocumentCreated('agendas/{agendaId}', async (event) => {
  const agenda = event.data?.data();
  if (!agenda || agenda.source !== 'link' || agenda.status !== 'requested') return;

  await pushToUser(agenda.driverId as string, {
    channel: 'viagens',
    title: `${agenda.passengerName} pediu carona`,
    message: `${whenLabel(agenda)} · ${agenda.origin} → ${agenda.destination}`,
    url: `/request/${event.params.agendaId}`,
  });
});

// Nome, foto e carro mudaram no perfil: a página de agendamento mostra esse cartão, então ele
// precisa acompanhar. Sem isto a página continuaria exibindo o carro antigo.
export const onUserUpdated = onDocumentUpdated('users/{uid}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after || !after.slug) return;

  const changed =
    before.name !== after.name ||
    before.photoURL !== after.photoURL ||
    JSON.stringify(before.vehicle ?? null) !== JSON.stringify(after.vehicle ?? null);
  if (!changed) return;

  await getFirestore()
    .doc(`links/${after.slug}`)
    .update({
      driver: { name: after.name ?? '', photoURL: after.photoURL ?? null, vehicle: after.vehicle ?? null },
    })
    .catch(() => undefined);
});

// A véspera. Esta é a mensagem que devolve a exceção como dado: o motorista recebe a lista de
// amanhã e manda o aviso para cada um com o link junto, e quem não vai avisa pelo link em vez de
// avisar por um texto solto que o app nunca vê.
//
// Por enquanto a conta passa por todas as agendas confirmadas uma vez por dia. Com dezenas de
// motoristas isso é barato; passando de alguns milhares, vale guardar o próximo dia em cada
// agenda e consultar por data.
export const remindTomorrow = onSchedule({ schedule: '0 19 * * *', timeZone: TIMEZONE }, async () => {
  const db = getFirestore();
  const tomorrow = addDays(todayISO(), 1);
  const weekday = weekdayOf(tomorrow);

  const agendas = await db.collection('agendas').where('status', '==', 'confirmed').get();
  const byDriver = new Map<string, { name: string; time: string }[]>();

  for (const doc of agendas.docs) {
    const a = doc.data();
    const serve = a.kind === 'recurring' ? ((a.weekdays as number[]) ?? []).includes(weekday) : a.date === tomorrow;
    if (!serve) continue;
    if (a.kind === 'recurring' && a.startDate && (a.startDate as string) > tomorrow) continue;

    // Dia já cancelado não entra na lista.
    const trip = await db.doc(`trips/${doc.id}_${tomorrow}`).get();
    if (trip.exists && trip.get('status') === 'cancelled') continue;

    const list = byDriver.get(a.driverId as string) ?? [];
    list.push({ name: a.passengerName as string, time: a.time as string });
    byDriver.set(a.driverId as string, list);
  }

  for (const [driverId, list] of byDriver) {
    list.sort((a, b) => a.time.localeCompare(b.time));
    const quantos = list.length === 1 ? '1 viagem' : `${list.length} viagens`;
    await pushToUser(driverId, {
      channel: 'viagens',
      title: `Amanhã: ${quantos}`,
      message: list.map((t) => `${t.time} ${t.name}`).join(' · '),
      url: '/agenda',
    });
  }
});
