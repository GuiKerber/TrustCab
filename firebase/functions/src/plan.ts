import './setup';

import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { pushToUser } from './notify';
import { addDays, daysBetween, TIMEZONE, todayISO } from './slots';

// O plano: um mês inteiro liberado, depois R$ 19,90 por mês.
//
// Quem escreve a data do fim é só o servidor. O app lê e desenha. Se o app pudesse escrever,
// mudar a data no relógio do celular — ou editar o próprio documento — esticaria o teste para
// sempre, e as regras do Firestore por isso não deixam users.plan ser tocado pelo cliente.
//
// "Vencido" não fica guardado: é a comparação entre plan.until e o dia de hoje. Guardar um estado
// que o calendário já responde é guardar duas verdades e torcer para que elas batam.

export const TRIAL_DAYS = 30;
const WARN_AT = [7, 3, 1, 0];

// Conta nova começa o teste no dia em que nasce, contando o primeiro dia.
export const onUserCreated = onDocumentCreated('users/{uid}', async (event) => {
  const data = event.data?.data();
  if (!data) return;
  if (data.plan?.until) return;

  const today = todayISO();
  await event.data!.ref.update({
    plan: { status: 'trial', until: addDays(today, TRIAL_DAYS - 1), source: 'none' },
  });
});

// Aviso do fim do teste. Sai de manhã, no fuso de quem usa, e só nos dias que importam —
// avisar todo dia vira ruído e a pessoa desliga a notificação inteira.
export const warnPlanEnding = onSchedule(
  { schedule: '0 9 * * *', timeZone: TIMEZONE },
  async () => {
    const db = getFirestore();
    const today = todayISO();
    const limit = addDays(today, 7);

    const users = await db
      .collection('users')
      .where('plan.until', '>=', today)
      .where('plan.until', '<=', limit)
      .get();

    for (const doc of users.docs) {
      const plan = doc.get('plan') ?? {};
      if (plan.status === 'active') continue;
      const left = daysBetween(today, plan.until);
      if (!WARN_AT.includes(left)) continue;

      const title =
        left === 0 ? 'Seu mês grátis acaba hoje' : left === 1 ? 'Seu mês grátis acaba amanhã' : `Seu mês grátis acaba em ${left} dias`;
      await pushToUser(doc.id, {
        channel: 'viagens',
        title,
        message: 'Depois disso seu link para de receber pedidos novos. O que já está combinado continua.',
        url: '/plan',
      });
    }
  },
);

// Libera um mês. É por aqui que a cobrança vai entrar quando o meio de pagamento estiver
// escolhido: o aviso do provedor chama esta conta e ela empurra a data.
// Enquanto isso, só uma conta com a marca de administrador chama — e é assim que o primeiro
// motorista que pagar por fora é liberado à mão, sem abrir uma porta para todo mundo.
export const grantMonth = onCall<{ uid: string; months?: number; source?: 'play' | 'pix' }>(async (request) => {
  if (request.auth?.token?.admin !== true) {
    throw new HttpsError('permission-denied', 'Só a administração libera plano.');
  }
  const uid = String(request.data?.uid ?? '');
  if (!uid) throw new HttpsError('invalid-argument', 'Informe o uid do motorista.');

  const months = Math.min(12, Math.max(1, Number(request.data?.months ?? 1)));
  const db = getFirestore();
  const ref = db.doc(`users/${uid}`);
  const plan = (await ref.get()).get('plan') ?? {};
  const today = todayISO();
  // Renovar antes de vencer soma ao que falta, em vez de jogar os dias fora.
  const from = plan.until && plan.until > today ? plan.until : today;

  const until = addDays(from, 30 * months);
  await ref.update({ plan: { status: 'active', until, source: request.data?.source ?? 'pix' } });
  return { until };
});
