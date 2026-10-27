// Denúncia de uma pessoa ou de uma conversa. A política de conteúdo gerado pelo usuário do Google Play
// exige um caminho no app para denunciar, além do bloqueio que já existe ("Sair da rede" no passageiro e
// "Encerrar conexão" no motorista).
// Enquanto os apps rodam sem backend, a denúncia sai pelo e-mail de contato. Com o Firestore ligado ela
// vira um registro na coleção de denúncias, e esta função some.

export const REPORT_EMAIL = 'contact@guikerber.com';

export function reportUrl({ reported, reporter }: { reported: string; reporter?: string }) {
  const subject = `Denúncia no TrustCab: ${reported}`;
  const body = [
    `Pessoa denunciada: ${reported}`,
    reporter ? `Denunciado por: ${reporter}` : null,
    '',
    'Conte o que aconteceu (quanto mais detalhe, mais rápido a gente resolve):',
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');
  return `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// O mesmo texto nos dois apps: o que a denúncia faz e o que ela não faz.
export function reportText(firstName: string) {
  return `Conte o que ${firstName} fez. A denúncia abre o seu app de e-mail com uma mensagem pronta e vai para a nossa equipe, que responde em até 48 horas. Denunciar não encerra a conexão: para parar de receber mensagens agora, use a opção de encerrar.`;
}
