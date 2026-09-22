import { useAuth } from './auth';
import { demoEnabled } from './config';

function entryText(configured: boolean, missing: string[]) {
  if (__DEV__) {
    return configured
      ? 'Modo de desenvolvimento: no Expo Go o Google não deixa entrar. Veja as telas sem conta:'
      : `Login ainda sem chaves (${missing.join(', ')}). Em desenvolvimento, dá para ver as telas sem conta:`;
  }
  if (demoEnabled) return 'Versão de demonstração: navegue pelo app com dados de exemplo, sem criar conta.';
  return `Login ainda sem chaves (${missing.join(', ')}).`;
}

// Liga o LoginScreen ao login: aviso de sessão expirada ou conta excluída, erro e a entrada sem conta
// (em desenvolvimento ou na versão de demonstração). Sem as chaves do Firebase, o botão do Google some.
export function useLoginProps() {
  const { signIn, busy, error, configured, missing, enterDevSession, reason } = useAuth();
  return {
    busy,
    error,
    onSignIn: configured ? signIn : undefined,
    notice:
      reason === 'expired'
        ? 'Sua sessão terminou. Entre de novo para continuar de onde parou.'
        : reason === 'deleted'
          ? 'Sua conta foi excluída. Se quiser voltar, é só entrar de novo.'
          : null,
    dev:
      !configured || demoEnabled
        ? {
            text: entryText(configured, missing),
            onEnter: demoEnabled ? enterDevSession : undefined,
          }
        : null,
  };
}
