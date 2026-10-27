// Planos do motorista. Grátis até três passageiros; pago, sem limite.
// O limite conta quem já está na rede mais os convites em aberto: senão bastaria convidar
// dez pessoas de uma vez e esperar aceitarem para passar por cima dele.

export type Plan = 'free' | 'pro';

export const FREE_PASSENGERS = 3;
export const PRO_PRICE_CENTS = 1990;

export function planLimit(plan: Plan) {
  return plan === 'pro' ? Infinity : FREE_PASSENGERS;
}

// Quantos lugares ainda cabem. Nunca negativo: quem assinou e depois voltou para o grátis
// continua com os passageiros que já tinha — o plano só barra convite novo.
export function seatsLeft(plan: Plan, used: number) {
  return Math.max(0, planLimit(plan) - used);
}

export function canInvite(plan: Plan, used: number) {
  return seatsLeft(plan, used) > 0;
}
