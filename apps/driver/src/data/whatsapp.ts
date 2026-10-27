import { Linking } from 'react-native';

import { whatsappShareUrl, whatsappUrl } from '@trustcab/core';

// Abrir o WhatsApp com a mensagem pronta. É o único jeito de o TrustCab falar com o passageiro:
// ele não tem app, não tem conta e não recebe notificação nossa.
//
// Quem envia é sempre o motorista, tocando em enviar. Não existe enviar sozinho pelo wa.me, e
// automatizar isso por fora — com biblioteca que finge ser o WhatsApp Web — derruba o número
// pessoal dele. Esse número é a ferramenta de trabalho da pessoa: não é um risco que a gente
// corre para economizar um toque.

export type SendResult = { ok: true } | { ok: false; message: string };

async function open(url: string): Promise<SendResult> {
  try {
    await Linking.openURL(url);
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: 'Não consegui abrir o WhatsApp. Confira se ele está instalado neste celular.',
    };
  }
}

// Conversa com um número, com o texto já escrito.
export function sendTo(phone: string | null | undefined, text: string) {
  if (!phone) {
    return Promise.resolve<SendResult>({
      ok: false,
      message: 'Esse passageiro está sem WhatsApp cadastrado. Abra o cadastro dele e preencha o número.',
    });
  }
  return open(whatsappUrl(phone, text));
}

// Sem destinatário: o WhatsApp pergunta para quem mandar. É assim que o link é espalhado.
export function shareText(text: string) {
  return open(whatsappShareUrl(text));
}
