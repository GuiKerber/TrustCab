import './setup';

import { FieldValue, getFirestore, type DocumentData } from 'firebase-admin/firestore';
import { onDocumentCreated, onDocumentUpdated, onDocumentWritten } from 'firebase-functions/v2/firestore';

import { day, nameOf, price, route, truncate, vehicle, when, type AgendaData, type Card } from './format';
import { addSystemMessage, pushToUser } from './notify';

const db = () => getFirestore();

const AGENDA_FIELDS = ['kind', 'weekdays', 'date', 'time', 'origin', 'destination', 'note', 'price'] as const;

function userCard(data: DocumentData | undefined): Card {
  return {
    name: data?.name ?? '',
    photoURL: data?.photoURL ?? null,
    phone: data?.phone ?? null,
    vehicle: data?.vehicle ?? null,
    notificationsEnabled: data?.notificationsEnabled ?? false,
  };
}

async function loadConnection(id: string) {
  const snap = await db().doc(`connections/${id}`).get();
  const data = snap.data();
  return {
    driver: (data?.driver ?? null) as Card | null,
    passenger: (data?.passenger ?? null) as Card | null,
    driverId: data?.driverId as string,
    passengerId: data?.passengerId as string,
  };
}

// Conexão: cópias públicas das pessoas, pedido, aprovação e encerramento (CV-05, CV-07).
export const onConnectionWritten = onDocumentWritten('connections/{id}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!after) return;
  const id = event.params.id;
  const statusChanged = before?.status !== after.status;
  if (!statusChanged) return;

  if (after.status === 'pending') {
    const [driverSnap, passengerSnap] = await Promise.all([
      db().doc(`users/${after.driverId}`).get(),
      db().doc(`users/${after.passengerId}`).get(),
    ]);
    const passenger = userCard(passengerSnap.data());
    await event.data!.after.ref.update({ driver: userCard(driverSnap.data()), passenger });
    await pushToUser(after.driverId, {
      channel: 'agenda',
      title: `${nameOf(passenger, 'Alguém')} quer viajar com você.`,
      message: 'Toque para aprovar.',
      url: '/passengers',
    });
    return;
  }

  if (after.status === 'active') {
    await addSystemMessage(id, 'Conexão aprovada. Combinem a agenda por aqui.', 'connection_active');
    await pushToUser(after.passengerId, {
      channel: 'agenda',
      title: `${nameOf(after.driver, 'Seu motorista')} aprovou sua conexão.`,
      message: 'Monte sua agenda de viagens.',
      url: `/connections/${id}`,
    });
    return;
  }

  if (after.status === 'ended' && before?.status === 'active') {
    const agendas = await db()
      .collection('agendas')
      .where('connectionId', '==', id)
      .where('status', 'in', ['requested', 'awaiting_passenger', 'confirmed'])
      .get();
    const batch = db().batch();
    agendas.docs.forEach((doc) =>
      batch.update(doc.ref, { status: 'ended', endedByConnection: true, updatedAt: FieldValue.serverTimestamp() }),
    );
    await batch.commit();

    await addSystemMessage(id, 'Conexão encerrada. As viagens futuras foram canceladas.', 'connection_ended');
    const endedByDriver = after.endedBy === after.driverId;
    const recipient = endedByDriver ? after.passengerId : after.driverId;
    const who = nameOf((endedByDriver ? before.driver : before.passenger) as Card, 'Uma pessoa');
    await pushToUser(recipient, {
      channel: 'agenda',
      title: after.accountDeleted ? `${who} excluiu a conta do TrustCab.` : `${who} encerrou a conexão com você.`,
      message: 'As viagens futuras foram canceladas.',
      url: '/conversations',
    });
  }
});

// Mantém as cópias públicas (conexões e convite) em dia quando a pessoa edita o perfil.
export const onUserUpdated = onDocumentUpdated('users/{uid}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  const keys = ['name', 'photoURL', 'phone', 'vehicle', 'notificationsEnabled'];
  if (keys.every((k) => JSON.stringify(before[k] ?? null) === JSON.stringify(after[k] ?? null))) return;

  const uid = event.params.uid;
  const card = userCard(after);
  const field = after.role === 'driver' ? 'driver' : 'passenger';
  const idField = after.role === 'driver' ? 'driverId' : 'passengerId';

  const connections = await db().collection('connections').where(idField, '==', uid).get();
  const batch = db().batch();
  connections.docs.forEach((doc) => batch.update(doc.ref, { [field]: card }));
  if (after.role === 'driver' && after.inviteToken) {
    batch.update(db().doc(`invites/${after.inviteToken}`), { driver: card });
  }
  await batch.commit();
});

function fieldsChanged(before: DocumentData, after: DocumentData) {
  return AGENDA_FIELDS.some((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null));
}

// Agenda: pedido, confirmação, recusa, proposta de valor, alteração e encerramento (AG-01 a AG-07).
export const onAgendaWritten = onDocumentWritten('agendas/{id}', async (event) => {
  const before = event.data?.before.data() as AgendaData | undefined;
  const after = event.data?.after.data() as AgendaData | undefined;
  if (!after) return;
  const id = event.params.id;
  const conn = await loadConnection(after.connectionId);
  const driverName = nameOf(conn.driver, 'Seu motorista');
  const passengerName = nameOf(conn.passenger, 'Seu passageiro');
  const agendaUrl = `/agendas/${id}`;

  if (!before) {
    await addSystemMessage(after.connectionId, `Agenda pedida: ${when(after)}, ${route(after)}.`, 'agenda_requested');
    // A volta chega junto da ida; um único aviso basta.
    if (after.returnOf) return;
    await pushToUser(after.driverId, {
      channel: 'agenda',
      title: `${passengerName} pediu viagens ${when(after)}.`,
      message: 'Toque para confirmar.',
      url: agendaUrl,
    });
    return;
  }

  if (before.status !== after.status) {
    if (before.status === 'requested' && after.status === 'confirmed') {
      await addSystemMessage(after.connectionId, `Agenda confirmada: ${when(after)}, ${price(after.price)}.`, 'agenda_confirmed');
      await pushToUser(after.passengerId, {
        channel: 'agenda',
        title: `${driverName} confirmou suas viagens ${when(after)}.`,
        message: route(after),
        url: agendaUrl,
      });
    } else if (after.status === 'declined') {
      await addSystemMessage(after.connectionId, `Agenda recusada: ${when(after)}.`, 'agenda_declined');
      await pushToUser(after.passengerId, {
        channel: 'agenda',
        title: `${driverName} não pode fazer as viagens ${when(after)}.`,
        message: 'Converse no chat para combinar outro horário.',
        url: `/chats/${after.connectionId}`,
      });
    } else if (after.status === 'awaiting_passenger') {
      await addSystemMessage(after.connectionId, `${driverName} propôs ${price(after.proposedPrice)} por viagem.`, 'agenda_price_proposed');
      await pushToUser(after.passengerId, {
        channel: 'agenda',
        title: `${driverName} propôs ${price(after.proposedPrice)} por viagem.`,
        message: 'Toque para aceitar ou conversar.',
        url: agendaUrl,
      });
    } else if (before.status === 'awaiting_passenger' && after.status === 'confirmed') {
      await addSystemMessage(after.connectionId, `Valor aceito: ${price(after.price)} por viagem.`, 'agenda_price_accepted');
      await pushToUser(after.driverId, {
        channel: 'agenda',
        title: `${passengerName} aceitou ${price(after.price)} por viagem.`,
        message: `Agenda confirmada: ${when(after)}.`,
        url: agendaUrl,
      });
    } else if (after.status === 'ended' && !after.endedByConnection) {
      await addSystemMessage(after.connectionId, `Agenda encerrada: ${when(after)}.`, 'agenda_ended');
      const endedByDriver = after.endedBy === after.driverId;
      await pushToUser(endedByDriver ? after.passengerId : after.driverId, {
        channel: 'agenda',
        title: `${endedByDriver ? driverName : passengerName} encerrou a agenda ${when(after)}.`,
        message: 'As próximas viagens desta agenda foram canceladas.',
        url: agendaUrl,
      });
    }
    return;
  }

  if (!before.pendingChange && after.pendingChange) {
    await addSystemMessage(after.connectionId, `Alteração pedida na agenda de ${when(after)}.`, 'agenda_change_requested');
    await pushToUser(after.driverId, {
      channel: 'agenda',
      title: `${passengerName} pediu uma alteração na agenda.`,
      message: 'Toque para ver e responder.',
      url: agendaUrl,
    });
    return;
  }

  if (before.pendingChange && !after.pendingChange) {
    const accepted = fieldsChanged(before, after);
    await addSystemMessage(
      after.connectionId,
      accepted ? `Alteração aceita: ${when(after)}, ${route(after)}.` : 'Alteração não aceita. A agenda anterior continua valendo.',
      accepted ? 'agenda_change_accepted' : 'agenda_change_declined',
    );
    await pushToUser(after.passengerId, {
      channel: 'agenda',
      title: accepted ? `${driverName} aceitou sua alteração.` : `${driverName} não aceitou a alteração.`,
      message: accepted ? when(after) : 'A agenda anterior continua valendo.',
      url: agendaUrl,
    });
  }
});

// Viagem do dia: “a caminho”, “cheguei”, conclusão e cancelamento (AV-01 a AV-05, AG-06).
export const onTripWritten = onDocumentWritten('trips/{id}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!after || before?.status === after.status) return;
  const id = event.params.id;
  const conn = await loadConnection(after.connectionId);
  const driverName = nameOf(conn.driver, 'Seu motorista');
  const tripUrl = `/trips/${id}`;

  switch (after.status) {
    case 'on_the_way':
      await addSystemMessage(after.connectionId, `${driverName} está a caminho.`, 'trip_on_the_way');
      await pushToUser(after.passengerId, {
        channel: 'chegada',
        title: `${driverName} está a caminho.`,
        message: `Embarque às ${after.time}.`,
        url: tripUrl,
      });
      break;
    case 'arrived':
      await addSystemMessage(after.connectionId, `${driverName} chegou.`, 'trip_arrived');
      await pushToUser(after.passengerId, {
        channel: 'chegada',
        title: `${driverName} chegou.`,
        message: vehicle(conn.driver),
        url: tripUrl,
      });
      break;
    case 'completed':
      await addSystemMessage(after.connectionId, 'Viagem concluída.', 'trip_completed');
      break;
    case 'cancelled': {
      const byDriver = after.cancelledBy === after.driverId;
      const who = byDriver ? driverName : nameOf(conn.passenger, 'Seu passageiro');
      await addSystemMessage(
        after.connectionId,
        `Viagem de ${day(after.date)}, às ${after.time}, cancelada por ${who}.`,
        'trip_cancelled',
      );
      await pushToUser(byDriver ? after.passengerId : after.driverId, {
        channel: 'agenda',
        title: `${who} cancelou a viagem de ${day(after.date)}, às ${after.time}.`,
        message: 'As outras viagens da agenda continuam.',
        url: tripUrl,
      });
      break;
    }
  }
});

// Mensagem nova: prévia na lista, contador de não lidas e notificação (CH-01, CH-03).
export const onMessageCreated = onDocumentCreated('connections/{connectionId}/messages/{messageId}', async (event) => {
  const message = event.data?.data();
  if (!message || message.type !== 'text') return;
  const { connectionId } = event.params;
  const conn = await loadConnection(connectionId);
  const fromDriver = message.senderId === conn.driverId;
  const recipient = fromDriver ? conn.passengerId : conn.driverId;
  const senderName = nameOf(fromDriver ? conn.driver : conn.passenger, 'Nova mensagem');

  await db()
    .doc(`connections/${connectionId}`)
    .update({
      lastMessage: { text: truncate(message.text), senderId: message.senderId, at: FieldValue.serverTimestamp() },
      [`unread.${recipient}`]: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

  // “Entregue” significa que a notificação foi aceita para o celular da outra pessoa.
  const delivered = await pushToUser(recipient, {
    channel: 'mensagens',
    title: senderName,
    message: truncate(message.text),
    url: `/chats/${connectionId}`,
  });
  if (delivered) {
    await event.data!.ref.update({ deliveredAt: FieldValue.serverTimestamp() });
  }
});

// Aviso automático de um lado para o outro. Motorista: a caminho, cheguei, concluída, cancelada, reativada, pagamento
// confirmado. Passageiro: cancelou, avisou que pagou. O app grava a mensagem no chat com type "notice" e o texto da
// notificação em "push"; aqui ela vira push no celular da outra pessoa, mesmo com o app dela fechado.
export const onTripNotice = onDocumentCreated('connections/{connectionId}/messages/{messageId}', async (event) => {
  const message = event.data?.data();
  if (!message || message.type !== 'notice' || !message.push) return;
  const { connectionId } = event.params;
  const conn = await loadConnection(connectionId);
  const fromDriver = message.senderId === conn.driverId;
  if (!fromDriver && message.senderId !== conn.passengerId) return;
  const recipient = fromDriver ? conn.passengerId : conn.driverId;

  await db()
    .doc(`connections/${connectionId}`)
    .update({
      lastMessage: { text: truncate(message.text), senderId: message.senderId, at: FieldValue.serverTimestamp() },
      [`unread.${recipient}`]: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

  const delivered = await pushToUser(recipient, {
    // A caminho e cheguei vão no canal de chegada (alta prioridade); o resto, no de agenda.
    channel: message.event === 'on_the_way' || message.event === 'arrived' ? 'chegada' : 'agenda',
    title: String(message.push.title),
    message: String(message.push.body),
    url: `/chats/${connectionId}`,
  });
  if (delivered) {
    await event.data!.ref.update({ deliveredAt: FieldValue.serverTimestamp() });
  }
});
