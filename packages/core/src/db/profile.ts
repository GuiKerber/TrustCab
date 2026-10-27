import { useEffect, useState } from 'react';

import { TERMS_VERSION } from '../links';
import { db } from './client';
import { useDoc } from './live';
import { createUser } from './queries';
import type { Role, UserDoc } from './types';

type Signed = { uid: string; displayName: string | null; email: string | null; photoURL: string | null } | null;

// Primeiro acesso: a sessão do Google existe, mas o perfil no banco ainda não. Esta é a única
// escrita que cria "users/{uid}" — e o papel (motorista ou passageiro) é decidido pelo app que
// está rodando, porque uma conta é uma coisa ou a outra, nunca as duas.
//
// Enquanto o perfil não existe, "loading" continua verdadeiro: as telas não devem decidir nada
// (nem mandar a pessoa para o onboarding) com base num perfil que ainda está sendo criado.
export function useProfileDoc(user: Signed, role: Role) {
  const uid = user?.uid ?? null;
  const live = useDoc<UserDoc>(uid ? `users/${uid}` : null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db || !user || live.loading || live.data || creating) return;
    setCreating(true);
    createUser(user.uid, {
      role,
      name: user.displayName ?? '',
      email: user.email ?? '',
      photoURL: user.photoURL,
      termsVersion: TERMS_VERSION,
    })
      .catch(setError)
      .finally(() => setCreating(false));
  }, [user, role, live.loading, live.data, creating]);

  return {
    profile: live.data,
    loading: live.loading || creating || (Boolean(user) && !live.data && !error),
    error: error ?? live.error,
  };
}
