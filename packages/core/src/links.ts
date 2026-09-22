// Endereço do convite. O domínio é o do Firebase Hosting do projeto; troque aqui e no app.json do passageiro
// (intentFilters) e no assetlinks.json quando um domínio próprio entrar no lugar.
export const INVITE_HOST = 'trustcab-9bab6.web.app';

// Pacote do app do passageiro na Play Store: é ele que recebe o convite.
export const PASSENGER_PACKAGE = 'com.trustcab.app';

// Tokens do servidor: 8 caracteres, sem letras e números fáceis de confundir.
const TOKEN_LENGTH = 8;

export function inviteUrl(token: string) {
  return `https://${INVITE_HOST}/i/${token}`;
}

// Link curto para escrever e ditar. Vira o endereço completo quando alguém toca nele.
export function inviteShortUrl(token: string) {
  return `${INVITE_HOST}/i/${token}`;
}

// Código mostrado na página e no app, em dois blocos, para ler e digitar sem errar.
export function inviteCode(token: string) {
  return token.length === TOKEN_LENGTH ? `${token.slice(0, 4)}-${token.slice(4)}` : token;
}

// Aceita o código digitado de qualquer jeito: com o link inteiro, com hífen, em minúsculas.
export function parseInviteCode(input: string) {
  return input
    .trim()
    .replace(/^.*\/i\//, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();
}

// Instalação pela Play Store guardando o convite: o Android entrega esse "referrer" ao app no primeiro acesso,
// e ele abre direto no convite, sem ninguém digitar nada.
export function playStoreUrl(token?: string) {
  const base = `https://play.google.com/store/apps/details?id=${PASSENGER_PACKAGE}`;
  return token ? `${base}&referrer=${encodeURIComponent(`invite=${token}`)}` : base;
}

// Token que veio da instalação (ex.: "invite=ABCD2345&utm_source=…"), se houver.
export function inviteFromReferrer(referrer: string | null | undefined) {
  if (!referrer) return null;
  const decoded = referrer.includes('%3D') || referrer.includes('%26') ? decodeURIComponent(referrer) : referrer;
  const token = new URLSearchParams(decoded.replace(/^\?/, '')).get('invite');
  if (!token) return null;
  const clean = parseInviteCode(token);
  return clean.length === TOKEN_LENGTH ? clean : null;
}
