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
