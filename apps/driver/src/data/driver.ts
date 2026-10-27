import { useAuth } from '@trustcab/core/auth';
import { useUser } from '@trustcab/core/db';
import { defaultSlots, isOpen, newPlan, todayISO, type Plan, type Slots } from '@trustcab/core';

// O perfil do motorista como está no banco. Link, horários e plano moram lá e só o servidor
// escreve os dois últimos campos — por isso as telas leem daqui e não do store local.
export function useDriver() {
  const { user, devSession } = useAuth();
  const uid = user?.uid ?? null;
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
  };
}
