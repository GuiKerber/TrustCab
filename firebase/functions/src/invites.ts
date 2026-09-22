import './setup';

import { randomInt } from 'node:crypto';

import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';

import { vehicle, type Card } from './format';

// Sem letras e números fáceis de confundir (0/O, 1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

// Pacote do app do passageiro na Play Store e domínio do convite (o mesmo de packages/core/src/links.ts
// e do intentFilters no app.json do passageiro). O domínio real vem do pedido; este é o reserva.
const PASSENGER_PACKAGE = 'com.trustcab.app';
const HOST = 'trustcab-9bab6.web.app';

function newToken() {
  return Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
}

// CV-01 e CV-06: gera um convite novo e desativa o anterior. O token nasce no servidor para não ser previsível.
export const rotateInvite = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Entre na sua conta para gerar um convite.');

  const db = getFirestore();
  const userRef = db.doc(`users/${uid}`);
  const user = (await userRef.get()).data();
  if (user?.role !== 'driver') throw new HttpsError('permission-denied', 'Só motoristas geram convites.');
  if (!user.vehicle) throw new HttpsError('failed-precondition', 'Cadastre o veículo antes de convidar passageiros.');

  let token = newToken();
  while ((await db.doc(`invites/${token}`).get()).exists) token = newToken();

  const driver: Card = {
    name: user.name ?? '',
    photoURL: user.photoURL ?? null,
    phone: user.phone ?? null,
    vehicle: user.vehicle ?? null,
    notificationsEnabled: user.notificationsEnabled ?? false,
  };

  const batch = db.batch();
  if (user.inviteToken) {
    batch.update(db.doc(`invites/${user.inviteToken}`), { active: false, revokedAt: FieldValue.serverTimestamp() });
  }
  batch.set(db.doc(`invites/${token}`), {
    driverId: uid,
    active: true,
    driver,
    createdAt: FieldValue.serverTimestamp(),
  });
  batch.update(userRef, { inviteToken: token });
  await batch.commit();

  return { token };
});

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function page({ title, description, image, body }: { title: string; description: string; image?: string | null; body: string }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:site_name" content="TrustCab">
${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ''}
<style>
  :root { --ink:#000d10; --muted:#6b6b72; --line:#d5d3d4; }
  * { box-sizing: border-box; }
  body { margin:0; background:#fff; color:var(--ink); font:18px/1.61 Inter, "Helvetica Neue", Arial, sans-serif; }
  main { max-width: 480px; margin: 0 auto; padding: 38px 22px; display: grid; gap: 22px; }
  .brand { font-weight: 700; font-size: 17px; letter-spacing: .06em; text-transform: uppercase; }
  h1 { font-size: 37px; line-height: 1.1; letter-spacing: -.37px; margin: 0; }
  img { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; background: var(--ink); }
  .muted { color: var(--muted); }
  .code { border: 1px solid var(--ink); padding: 16px 22px; font-weight: 700; font-size: 30px; letter-spacing: .08em; }
  .button { display:flex; align-items:center; justify-content:center; min-height:48px; padding: 0 22px; border-radius:1000px; background:var(--ink); color:#fff; font-weight:700; font-size:17px; text-decoration:none; }
  .button.secondary { background:#fff; color:var(--ink); border:1px solid var(--ink); }
  .button:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }
  ol { margin: 0; padding-left: 22px; }
</style>
</head>
<body><main>${body}</main></body>
</html>`;
}

// CV-02: página do link. O WhatsApp lê as tags og:* para a prévia; com o app instalado, o Android abre o app direto.
export const invitePage = onRequest(async (req, res) => {
  const token = (req.path.split('/').filter(Boolean).pop() ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const snap = token.length === 8 ? await getFirestore().doc(`invites/${token}`).get() : null;
  const invite = snap?.data();

  res.set('Cache-Control', 'public, max-age=60');

  if (!invite?.active) {
    res.status(404).send(
      page({
        title: 'Convite inativo · TrustCab',
        description: 'Este convite não está mais ativo.',
        body: `<p class="brand">TrustCab</p>
<h1>Convite inativo.</h1>
<p>Este convite não está mais ativo. Peça um novo link para quem te enviou.</p>`,
      }),
    );
    return;
  }

  const driver = invite.driver as Card;
  const name = escapeHtml(driver.name || 'Seu motorista');
  const code = `${token.slice(0, 4)}-${token.slice(4)}`;
  // Instalando pela loja por este endereço, o Android guarda o convite e o app abre nele sozinho.
  const store = `https://play.google.com/store/apps/details?id=${PASSENGER_PACKAGE}&referrer=${encodeURIComponent(`invite=${token}`)}`;
  // Com o app instalado, o próprio endereço desta página já abre o app (App Links). Este botão cobre os dois casos:
  // abre o app se ele existir e, se não existir, cai na loja com o convite junto.
  const open = `intent://${req.headers.host ?? HOST}/i/${token}#Intent;scheme=https;package=${PASSENGER_PACKAGE};S.browser_fallback_url=${encodeURIComponent(store)};end`;

  res.status(200).send(
    page({
      title: `${driver.name || 'Seu motorista'} te convidou para o TrustCab`,
      description: 'Toque para pedir conexão e combinar suas viagens.',
      image: driver.photoURL,
      body: `<p class="brand">TrustCab</p>
${driver.photoURL ? `<img src="${escapeHtml(driver.photoURL)}" alt="">` : ''}
<h1>${name} te convidou.</h1>
<p class="muted">${escapeHtml(vehicle(driver))}</p>
<a class="button" href="${escapeHtml(open)}">Abrir no TrustCab</a>
<a class="button secondary" href="${escapeHtml(store)}">Baixar na Play Store</a>
<p class="muted">Sem o app, o botão leva você à loja e o convite fica guardado: ao abrir o TrustCab pela primeira vez, ${name} já aparece esperando você.</p>
<p>Se o convite não aparecer sozinho, entre com sua conta Google, toque em “Tenho um convite” e digite:</p>
<p class="code" aria-label="Código ${token.split('').join(' ')}">${code}</p>`,
    }),
  );
});
