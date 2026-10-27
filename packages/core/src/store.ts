import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

// Estado compartilhado simples: um valor, quem escuta e um hook para ler. Os stores novos usam este molde.
export function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return {
    get: () => value,
    set: (next: T) => {
      value = next;
      listeners.forEach((listener) => listener());
    },
    use: () =>
      useSyncExternalStore(
        subscribe,
        () => value,
        () => value,
      ),
  };
}

// Store que sobrevive a fechar o app. Mesmo molde do createStore, com o valor guardado no
// aparelho: é o que faz o primeiro acesso não recomeçar do zero a cada abertura.
// Só para o que é do próprio usuário (perfil, preferências) — dados de exemplo continuam em memória.
export function createPersistedStore<T>(chave: string, initial: T) {
  const store = createStore(initial);
  // Até a leitura do disco terminar, ninguém grava por cima do que já estava salvo.
  let carregado = false;

  AsyncStorage.getItem(chave)
    .then((bruto) => {
      // Campos novos de versões futuras entram pelo "initial"; o que estava salvo manda no resto.
      if (bruto) store.set({ ...initial, ...(JSON.parse(bruto) as Partial<T>) });
    })
    .catch(() => {})
    .finally(() => {
      carregado = true;
    });

  return {
    ...store,
    set: (next: T) => {
      store.set(next);
      if (carregado) AsyncStorage.setItem(chave, JSON.stringify(next)).catch(() => {});
    },
  };
}
