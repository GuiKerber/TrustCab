import './setup';

import { FieldValue, getFirestore, type Firestore } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';

import {
  emptyForm,
  firstName,
  parsePhone,
  readForm,
  renderDone,
  renderForm,
  renderMessage,
  validate,
  type Context,
  type DriverCard,
  type Form,
} from './page';
import {
  addDated,
  addDays,
  addWeekly,
  emptyOccupancy,
  isPast,
  isValidDate,
  isValidTime,
  nextDates,
  nowTime,
  readSlots,
  slotTimes,
  todayISO,
} from './slots';

// Os dados da página de agendamento e o endereço que responde por ela. O desenho está em page.ts.

// Tetos do link público. Um mesmo número pede algumas vezes por dia; a caixa de pedidos de um
// motorista não passa de algumas dezenas esperando resposta.
const MAX_REQUESTS_PER_PHONE_PER_DAY = 5;
const MAX_PENDING_PER_DRIVER = 40;

// ─── Leitura ─────────────────────────────────────────────────────────────────

// Monta a ocupação do motorista: o que está combinado, o que espera resposta, e as viagens
// canceladas, que devolvem a vaga daquele dia.
async function loadOccupancy(db: Firestore, driverId: string, today: string) {
  const occupancy = emptyOccupancy();

  const agendas = await db.collection('agendas').where('driverId', '==', driverId).get();
  for (const doc of agendas.docs) {
    const a = doc.data();
    if (a.status !== 'requested' && a.status !== 'confirmed') continue;
    if (!isValidTime(a.time ?? '')) continue;
    if (a.kind === 'recurring') {
      const start = isValidDate(a.startDate ?? '') ? a.startDate : today;
      for (const weekday of (a.weekdays ?? []) as number[]) addWeekly(occupancy, weekday, a.time, start);
    } else if (isValidDate(a.date ?? '')) {
      addDated(occupancy, a.date, a.time);
    }
  }

  // Dia cancelado volta a ficar livre. Só olhamos daqui para frente.
  const trips = await db.collection('trips').where('driverId', '==', driverId).where('date', '>=', today).get();
  for (const doc of trips.docs) {
    const t = doc.data();
    if (t.status !== 'cancelled') continue;
    if (isValidDate(t.date ?? '') && isValidTime(t.time ?? '')) addDated(occupancy, t.date, t.time, -1);
  }

  return occupancy;
}

async function loadContext(db: Firestore, slug: string): Promise<Context | { closed: 'notfound' | 'off' | 'expired' }> {
  const link = (await db.doc(`links/${slug}`).get()).data();
  if (!link) return { closed: 'notfound' };
  if (link.active !== true) return { closed: 'off' };

  const user = (await db.doc(`users/${link.driverId}`).get()).data();
  if (!user) return { closed: 'notfound' };

  const today = todayISO();
  const plan = user.plan ?? {};
  // Plano vencido fecha a porta de entrada, não o histórico: o motorista continua com tudo o que
  // já combinou, mas o link para de aceitar pedido novo.
  if (plan.status === 'expired' || !plan.until || plan.until < today) return { closed: 'expired' };

  const slots = readSlots(user.slots);
  const occupancy = await loadOccupancy(db, link.driverId, today);

  return {
    slug,
    driverId: link.driverId,
    driver: {
      name: (link.driver?.name ?? user.name ?? 'Seu motorista') as string,
      photoURL: (link.driver?.photoURL ?? user.photoURL ?? null) as string | null,
      vehicle: (link.driver?.vehicle ?? user.vehicle ?? null) as DriverCard['vehicle'],
    },
    driverPhone: typeof user.phone === 'string' && user.phone.length >= 10 ? user.phone : null,
    slots,
    occupancy,
    today,
    now: nowTime(),
    dates: nextDates(slots, today),
    times: slotTimes(slots),
  };
}

// ─── Escrita ─────────────────────────────────────────────────────────────────

// Trava simples contra abuso: o link é público, então um mesmo número só pede algumas vezes por
// dia, e a caixa de pedidos do motorista tem teto. Não é blindagem — é o bastante para o teste,
// e quem passar disso ele resolve trocando o link.
async function overLimit(db: Firestore, driverId: string, phone: string) {
  const today = todayISO();
  const ref = db.doc(`rateLimits/${driverId}_${phone}`);
  const snap = await ref.get();
  const data = snap.data();
  const count = data?.day === today ? Number(data.count ?? 0) : 0;
  if (count >= MAX_REQUESTS_PER_PHONE_PER_DAY) return 'phone' as const;

  const pending = await db
    .collection('agendas')
    .where('driverId', '==', driverId)
    .where('status', '==', 'requested')
    .count()
    .get();
  if (pending.data().count >= MAX_PENDING_PER_DRIVER) return 'driver' as const;

  await ref.set({ day: today, count: count + 1, updatedAt: FieldValue.serverTimestamp() });
  return null;
}

// Um contato por telefone. Quem já andou com ele antes não vira cadastro novo — é o mesmo
// passageiro pedindo outra vez, e é isso que faz a lista do motorista continuar legível.
async function findOrCreatePassenger(db: Firestore, driverId: string, name: string, phone: string) {
  const existing = await db
    .collection('passengers')
    .where('driverId', '==', driverId)
    .where('phone', '==', phone)
    .limit(1)
    .get();
  if (!existing.empty) return existing.docs[0].id;

  const ref = await db.collection('passengers').add({
    driverId,
    name,
    phone,
    note: '',
    archived: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

async function saveRequest(db: Firestore, ctx: Context, form: Form, phone: string) {
  const passengerId = await findOrCreatePassenger(db, ctx.driverId, form.name, phone);

  // Enviar duas vezes (toque duplo, voltar e reenviar) não vira dois pedidos iguais.
  const same = await db
    .collection('agendas')
    .where('driverId', '==', ctx.driverId)
    .where('passengerId', '==', passengerId)
    .where('status', '==', 'requested')
    .get();
  const duplicate = same.docs.find((doc) => {
    const a = doc.data();
    return (
      a.kind === form.kind &&
      a.time === form.time &&
      (form.kind === 'single' ? a.date === form.date : String(a.weekdays ?? []) === String(form.weekdays))
    );
  });
  if (duplicate) return duplicate.id;

  // A recorrente começa hoje, a não ser que o horário de hoje já tenha passado: marcar "toda
  // segunda às 07:00" numa segunda de tarde não pode deixar a segunda de hoje na conta.
  const startDate =
    form.kind === 'single' ? form.date : isPast(ctx.today, form.time, ctx.today, ctx.now) ? addDays(ctx.today, 1) : ctx.today;

  const ref = await db.collection('agendas').add({
    driverId: ctx.driverId,
    passengerId,
    passengerName: form.name,
    passengerPhone: phone,
    status: 'requested',
    source: 'link',
    startDate,
    kind: form.kind,
    weekdays: form.kind === 'recurring' ? form.weekdays : [],
    date: form.kind === 'single' ? form.date : null,
    time: form.time,
    origin: form.origin,
    destination: form.destination,
    note: form.note,
    price: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

// ─── A Function ──────────────────────────────────────────────────────────────

export const bookingPage = onRequest({ cors: false }, async (req, res) => {
  const slug = (req.path.split('/').filter(Boolean).pop() ?? '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  // A disponibilidade muda a cada pedido: esta página não pode ficar guardada em lugar nenhum.
  res.set('Cache-Control', 'no-store');
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Referrer-Policy', 'no-referrer');
  res.set('X-Content-Type-Options', 'nosniff');

  if (!slug || slug.length < 3) {
    const { status, html } = renderMessage('Link inválido', 'Esse link não existe.', 'Confira o endereço com quem te mandou.', 404);
    res.status(status).send(html);
    return;
  }

  const db = getFirestore();
  const loaded = await loadContext(db, slug);

  if ('closed' in loaded) {
    const message =
      loaded.closed === 'notfound'
        ? renderMessage('Link inválido', 'Esse link não existe.', 'Confira o endereço com quem te mandou.', 404)
        : loaded.closed === 'off'
          ? renderMessage('Link desativado', 'Este link saiu do ar.', 'Peça o link novo para o seu motorista.', 410)
          : renderMessage(
              'Agenda fechada',
              'Esta agenda está fechada.',
              'O motorista não está recebendo pedidos agora. Fale com ele pelo WhatsApp.',
              409,
            );
    res.status(message.status).send(message.html);
    return;
  }

  const ctx = loaded;

  if (req.method !== 'POST') {
    res.status(200).send(renderForm(ctx, emptyForm()));
    return;
  }

  const form = readForm((req.body ?? {}) as Record<string, unknown>);
  const invalid = validate(ctx, form);
  if (invalid) {
    res.status(200).send(renderForm(ctx, form, invalid));
    return;
  }

  const phone = parsePhone(form.phone)!;
  const limit = await overLimit(db, ctx.driverId, phone);
  if (limit) {
    res.status(429).send(
      renderForm(ctx, form, {
        title: limit === 'phone' ? 'Você já pediu várias vezes hoje.' : 'A agenda dele está cheia de pedidos.',
        detail:
          limit === 'phone'
            ? `Fale direto com ${firstName(ctx.driver.name)} no WhatsApp.`
            : `${firstName(ctx.driver.name)} ainda não respondeu os pedidos que recebeu. Fale com ele no WhatsApp.`,
      }),
    );
    return;
  }

  await saveRequest(db, ctx, form, phone);
  res.status(200).send(renderDone(ctx, { ...form, phone }));
});
