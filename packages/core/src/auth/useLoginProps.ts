import { useAuth } from './auth';

// Liga o LoginScreen ao login: aviso de sessão expirada ou conta excluída, erro e o modo de desenvolvimento.
export function useLoginProps() {
  const { signIn, busy, error, configured, missing, enterDevSession, reason } = useAuth();
  return {
    busy,
    error,
    onSignIn: signIn,
    notice:
      reason === 'expired'
        ? 'Sua sessão terminou. Entre de novo para continuar de onde parou.'
        : reason === 'deleted'
          ? 'Sua conta foi excluída. Se quiser voltar, é só entrar de novo.'
          : null,
    dev:
      !configured || __DEV__
        ? {
            text: !configured
              ? `Login ainda sem chaves (${missing.join(', ')}). Em desenvolvimento, dá para ver as telas sem conta:`
              : 'Modo de desenvolvimento: no Expo Go o Google não deixa entrar. Veja as telas sem conta:',
            onEnter: __DEV__ ? enterDevSession : undefined,
          }
        : null,
  };
}
