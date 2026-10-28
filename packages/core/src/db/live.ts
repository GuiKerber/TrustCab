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

// Um ouvinte por documento, compartilhado por quem pedir o mesmo caminho.
//
// Sem isto, cada tela que chama useDoc('users/abc') abre a sua própria escuta: o mesmo documento
// é cobrado duas vezes e, pior, as duas cópias passam por estados de carregamento diferentes. Foi
// assim que o Perfil chegou a dizer "mês grátis encerrado" com o app destrancado — duas leituras
// do mesmo plano, discordando por um instante.
type Shared<T> = { state: Live<T>; ouvintes: Set<(state: Live<T>) => void>; parar: () => void };
const abertos = new Map<string, Shared<unknown>>();

function assina<T>(path: string, avisar: (state: Live<T>) => void) {
  let aberto = abertos.get(path) as Shared<T> | undefined;
  if (!aberto) {
    const novo: Shared<T> = { state: { data: null as T, loading: true, error: null }, ouvintes: new Set(), parar: () => undefined };
    const emitir = (state: Live<T>) => {
      novo.state = state;
      novo.ouvintes.forEach((o) => o(state));
    };
    novo.parar = onSnapshot(
      doc(db!, path),
      (snap) => emitir({ data: (snap.exists() ? { id: snap.id, ...snap.data() } : null) as T, loading: false, error: null }),
      (error) => emitir({ data: null as T, loading: false, error }),
    );
    abertos.set(path, novo as Shared<unknown>);
    aberto = novo;
  }
  aberto.ouvintes.add(avisar);
  return () => {
    const atual = abertos.get(path) as Shared<T> | undefined;
    if (!atual) return;
    atual.ouvintes.delete(avisar);
    // O último a sair fecha a escuta.
    if (atual.ouvintes.size === 0) {
      atual.parar();
      abertos.delete(path);
    }
  };
}

// Um documento. Devolve null quando ele não existe (ainda).
export function useDoc<T>(path: string | null): Live<(T & { id: string }) | null> {
  type Dado = (T & { id: string }) | null;
  const [state, setState] = useState<Live<Dado>>({ data: null, loading: true, error: null });

  useEffect(() => {
    if (!db || !path) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState(((abertos.get(path) as Shared<Dado> | undefined)?.state ?? { data: null, loading: true, error: null }) as Live<Dado>);
    return assina<Dado>(path, setState);
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
