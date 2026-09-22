import { useNetworkState } from 'expo-network';

// Sem internet: só quando o aparelho confirma. Enquanto não sabe, conta como conectado para não assustar à toa.
export function useOnline() {
  const state = useNetworkState();
  return state.isConnected !== false && state.isInternetReachable !== false;
}
