import {
  collection,
  doc,
  onSnapshot,
  query as fsQuery,
  type DocumentData,
  type Query,
  type QueryConstraint,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { db } from './client';

// Estado de qualquer leitura ao vivo. "loading" só vale até o primeiro retorno; depois disso
// o Firestore continua empurrando mudanças sozinho, e é isso que faz os dois apps conversarem:
// o motorista escreve, o aparelho do passageiro recebe sem pedir.
export type Live<T> = { data: T; loading: boolean; error: Error | null };

// Um documento. Devolve null quando ele não existe (ainda).
export function useDoc<T>(path: string | null): Live<(T & { id: string }) | null> {
  const [state, setState] = useState<Live<(T & { id: string }) | null>>({ data: null, loading: true, error: null });

  useEffect(() => {
    if (!db || !path) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    return onSnapshot(
      doc(db, path),
      (snap) => setState({ data: snap.exists() ? ({ id: snap.id, ...snap.data() } as T & { id: string }) : null, loading: false, error: null }),
      (error) => setState({ data: null, loading: false, error }),
    );
  }, [path]);

  return state;
}

// Uma coleção filtrada. "constraints" precisa ser estável entre renders, por isso a chave:
// um array novo a cada render recriaria o ouvinte sem parar.
export function useCollection<T>(
  path: string | null,
  constraints: QueryConstraint[],
  key: string,
): Live<(T & { id: string })[]> {
  const [state, setState] = useState<Live<(T & { id: string })[]>>({ data: [], loading: true, error: null });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const where = useMemo(() => constraints, [key]);

  useEffect(() => {
    if (!db || !path) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const q: Query<DocumentData> = fsQuery(collection(db, path), ...where);
    return onSnapshot(
      q,
      (snap) => setState({ data: snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T & { id: string }), loading: false, error: null }),
      (error) => setState({ data: [], loading: false, error }),
    );
  }, [path, where]);

  return state;
}
