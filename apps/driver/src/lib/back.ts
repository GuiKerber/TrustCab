import { router } from 'expo-router';

// Voltar sem ter de onde.
//
// router.back() só funciona se existir uma tela embaixo na pilha. Quando o app abre direto numa
// tela — por uma notificação, por um link, ou porque o roteador escolheu ela ao sair do
// onboarding — não existe nada embaixo, e o botão "Voltar" simplesmente não faz nada. A pessoa
// aperta, não acontece, aperta de novo, e conclui que o app travou.
//
// Por isso todo botão de voltar do app passa por aqui: se dá para voltar, volta; se não dá, vai
// para onde aquela tela deveria ter nascido.
export function goBack(fallback: Parameters<typeof router.replace>[0] = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
