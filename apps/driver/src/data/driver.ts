import { useAuth } from '@trustcab/core/auth';
import { DEMO_UID, useUser } from '@trustcab/core/db';
import { defaultSlots, isOpen, newPlan, todayISO, type Plan, type Slots } from '@trustcab/core';

// O perfil do motorista como está no banco. Link, horários e plano moram lá e só o servidor
// escreve os dois últimos campos — por isso as telas leem daqui e não do store local.
export function useDriver() {
  const { user, devSession } = useAuth();
  // Na demonstração não há conta: o identificador falso é o que faz cada leitura cair no
  // conjunto de exemplo em vez de ir ao banco.
  const uid = devSession ? DEMO_UID : (user?.uid ?? null);
  const { data, loading, error } = useUser(uid);

  const slots: Slots = (data?.slots as Slots) ?? defaultSlots;
  const plan: Plan = (data?.plan as Plan) ?? newPlan();

  return {
    uid,
    devSession,
    loading,
    error,
    name: data?.name ?? user?.displayName ?? '',
    photoURL: data?.photoURL ?? user?.photoURL ?? null,
    phone: data?.phone ?? null,
    vehicle: data?.vehicle ?? null,
    pix: data?.pix ?? null,
    slug: data?.slug ?? null,
    slots,
    plan,
    // Liberado hoje? Vale para o teste e para o mês pago: é a mesma pergunta.
    open: isOpen(plan, todayISO()),
    // Trancar o app é diferente de perguntar se está liberado: só tranca quando o plano é
    // conhecido. Enquanto carrega, e se a leitura falhar, o app segue aberto — ninguém pode
    // perder a agenda do dia porque o celular ficou sem sinal na hora errada.
    locked: !loading && !error && !isOpen(plan, todayISO()),
  };
}
