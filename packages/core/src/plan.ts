// O plano do motorista. Um mês inteiro liberado, depois R$ 19,90 por mês.
// Quem decide o estado é o servidor (firebase/functions/src/plan.ts grava as datas); o app só lê
// e desenha. Assim mudar a data no relógio do celular não estende o teste.

export const TRIAL_DAYS = 30;
export const PRICE_CENTS = 1990;

// Quantos dias antes do fim o app começa a avisar.
export const WARN_DAYS = 7;

export type PlanSource = 'none' | 'play' | 'pix';
export type PlanStatus = 'trial' | 'active' | 'expired';

export type Plan = {
  status: PlanStatus;
  // Último dia liberado, em AAAA-MM-DD. É o fim do teste ou o fim do mês pago.
  until: string | null;
  source: PlanSource;
};

export const newPlan = (): Plan => ({ status: 'trial', until: null, source: 'none' });

// O teste acaba 30 dias depois do dia em que a conta nasceu, contando o primeiro dia.
export function trialEnd(startISO: string, days = TRIAL_DAYS) {
  const [y, m, d] = startISO.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days - 1)).toISOString().slice(0, 10);
}

// Dias cheios depois de hoje. É nessa contagem que o aviso do fim do teste é disparado: zero
// quer dizer "vence hoje", não "já venceu".
export function daysLeft(plan: Plan, todayISO: string) {
  if (!plan.until) return 0;
  const day = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((day(plan.until) - day(todayISO)) / 86_400_000);
}

// Dias que ainda dá para usar, contando hoje. É este o número que vai para a tela: no primeiro
// dia o teste de 30 dias precisa dizer 30, e não 29, senão a manchete desmente o texto embaixo.
export function daysOfAccess(plan: Plan, todayISO: string) {
  return daysLeft(plan, todayISO) + 1;
}

// Liberado hoje? Vale para o teste e para o mês pago: é a mesma pergunta.
export function isOpen(plan: Plan, todayISO: string) {
  return plan.status !== 'expired' && !!plan.until && plan.until >= todayISO;
}

// O plano já foi respondido pelo servidor?
//
// Conta recém-criada nasce com `until` em branco: o app escreve o perfil e quem põe a data é a
// Function onUserCreated, um instante depois. Nesse intervalo "sem data" não quer dizer vencido,
// quer dizer "ainda não sei" — e tratar um do jeito do outro é o que fazia a tela de plano
// vencido piscar no primeiro login.
export function planKnown(plan: Plan) {
  return Boolean(plan.until);
}

export function isEnding(plan: Plan, todayISO: string) {
  const left = daysLeft(plan, todayISO);
  return isOpen(plan, todayISO) && left <= WARN_DAYS;
}

// Quando o plano vence, o app fecha: sem assinatura não se vê agenda, não se recebe pedido e
// não se confirma viagem. Sobra o caminho de volta (assinar) e o de saída (excluir a conta).
//
// Os dados ficam guardados esperando. O motorista volta a combinar as caronas pelo WhatsApp dele,
// como fazia antes, e ao assinar encontra tudo onde deixou.
export const canReceiveRequests = isOpen;
export const canConfirmAgenda = isOpen;

export function priceLabel(cents = PRICE_CENTS) {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}
