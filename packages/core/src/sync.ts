import { useState } from 'react';

// Estado dos dados de uma tela: carregando, prontos ou com erro.
// Enquanto os dados são os de exemplo (locais), já nascem prontos. Com o Firestore, "loading" vale até o
// primeiro snapshot e "error" quando a leitura falha; "retry" refaz a leitura.
export type SyncState = 'loading' | 'ready' | 'error';

export function useSyncState() {
  const [state, setState] = useState<SyncState>('ready');
  return { state, retry: () => setState('ready') };
}
