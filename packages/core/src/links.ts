// Endereços do TrustCab. O domínio é o do Firebase Hosting do projeto; troque aqui, no
// firebase.json e no app.json do motorista quando um domínio próprio entrar no lugar.
export const HOST = 'trustcab-9bab6.web.app';

// Páginas que o aceite do login aponta. A Play Store também pede esses endereços na ficha da loja.
export const TERMS_URL = `https://${HOST}/termos.html`;
export const PRIVACY_URL = `https://${HOST}/privacidade.html`;

// Versão dos termos que o documento publicado traz no topo. É gravada no perfil no momento do
// aceite, para ficar registrado o que a pessoa leu — e só isso: ainda não existe tela que peça o
// aceite de novo quando este número sobe. Quem já tem conta continua com a versão antiga gravada.
export const TERMS_VERSION = 3;

// O WhatsApp do TrustCab: é por ele que o motorista acerta a mensalidade enquanto não existe um
// meio de pagamento ligado ao app. Só os dígitos, DDD + número.
// Null de propósito: preencher com um número que não é de ninguém faria o app abrir uma conversa
// com um desconhecido. Enquanto estiver null, a tela do plano explica em vez de abrir o WhatsApp.
export const SUPPORT_PHONE: string | null = null;

// ─── O link de agendamento ───────────────────────────────────────────────────
// Um link por motorista, permanente, para ele fixar no WhatsApp. Quem abre não tem conta,
// não instala nada e pede a agenda na própria página.

// Sem letras e números fáceis de confundir (0/O, 1/I/L): o link é ditado por telefone.
export const SLUG_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export const SLUG_RANDOM_LENGTH = 6;

export function bookingUrl(slug: string) {
  return `https://${HOST}/a/${slug}`;
}

// Versão curta para escrever e ditar. Vira o endereço completo quando alguém toca nela.
export function bookingShortUrl(slug: string) {
  return `${HOST}/a/${slug}`;
}

// Aceita o link inteiro, com ou sem https, ou só o código.
export function parseSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^.*\/a\//, '')
    .replace(/[^a-z0-9-]/g, '');
}

// Parte legível do slug: o primeiro nome, sem acento e sem espaço. O sorteio vem depois dele
// e é o que torna o link difícil de adivinhar.
export function slugBase(name: string) {
  const first = name.trim().split(/\s+/)[0] ?? '';
  const plain = first.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const clean = plain.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean.length >= 2 ? clean.slice(0, 16) : 'motorista';
}

// ─── Telefone ────────────────────────────────────────────────────────────────
// Guardamos só os dígitos do número brasileiro: DDD + número (10 ou 11 dígitos).

export function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

// Aceita o número colado de qualquer jeito: com +55, com parênteses, com espaços.
// Devolve os 10 ou 11 dígitos de DDD + número, ou null quando não dá para entender.
export function parsePhone(input: string) {
  let digits = onlyDigits(input);
  if (digits.startsWith('0055')) digits = digits.slice(4);
  else if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2);
  if (digits.length === 11 && digits[2] !== '9') return null;
  if (digits.length !== 10 && digits.length !== 11) return null;
  // DDD brasileiro vai de 11 a 99.
  if (Number(digits.slice(0, 2)) < 11) return null;
  return digits;
}

// ─── WhatsApp ────────────────────────────────────────────────────────────────
// Link oficial de conversa (wa.me). Abre a conversa com o número e deixa o texto escrito
// no campo de mensagem — quem envia é sempre a pessoa, tocando em enviar. Não há custo,
// não há API, não há aprovação de modelo de mensagem.

export function whatsappUrl(phone: string, text?: string) {
  const digits = onlyDigits(phone);
  // O wa.me exige o código do país junto. Números com 10 ou 11 dígitos são daqui.
  const full = digits.length <= 11 ? `55${digits}` : digits;
  return text ? `https://wa.me/${full}?text=${encodeURIComponent(text)}` : `https://wa.me/${full}`;
}

// Sem número: o WhatsApp abre a lista de contatos com o texto já escrito, e a pessoa escolhe
// para quem manda. É assim que o motorista espalha o próprio link.
export function whatsappShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
