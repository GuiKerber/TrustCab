import * as Linking from 'expo-linking';
import { router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { inviteFromReferrer, parseInviteCode } from '@trustcab/core';

// Três caminhos levam ao mesmo convite:
// 1. Com o app instalado, o link do motorista (https://…/i/CÓDIGO) abre o app direto — é o expo-router que resolve.
// 2. Sem o app, a pessoa instala pela Play Store e o Android entrega o código guardado no clique (install referrer).
// 3. Sem nada disso, ela digita o código na tela "Tenho um convite".
// Este arquivo cuida de 1 e 2 quando o convite chega antes do login: guarda o código e abre o convite
// assim que a conta e o primeiro acesso estiverem prontos.

function tokenFromUrl(url: string | null) {
  if (!url) return null;
  const path = url.replace(/^[a-z]+:\/\/[^/]*/i, '');
  const match = path.match(/\/i\/([^/?#]+)/i);
  return match ? parseInviteCode(match[1]) : null;
}

// O módulo nativo do install referrer só existe em build de verdade (EAS); no Expo Go e na web ele não entra.
let referrerChecked = false;

async function inviteFromInstall() {
  if (referrerChecked || Platform.OS !== 'android') return null;
  referrerChecked = true;
  try {
    const { PlayInstallReferrer } = require('react-native-play-install-referrer');
    const referrer = await new Promise<string | null>((resolve) => {
      PlayInstallReferrer.getInstallReferrerInfo((info: { installReferrer?: string } | null, error: unknown) => resolve(error ? null : (info?.installReferrer ?? null)));
    });
    return inviteFromReferrer(referrer);
  } catch {
    // Sem o módulo (Expo Go, web) ou sem resposta da loja: resta o código digitado.
    return null;
  }
}

// Abre o convite que chegou pelo link ou pela instalação, assim que o app estiver pronto para mostrá-lo.
export function usePendingInvite(ready: boolean) {
  const url = Linking.useURL();
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = tokenFromUrl(url);
    if (fromUrl) setToken(fromUrl);
  }, [url]);

  useEffect(() => {
    let active = true;
    inviteFromInstall().then((fromInstall) => {
      if (active && fromInstall) setToken(fromInstall);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready || !token) return;
    setToken(null);
    // Chegando pelo link com a sessão aberta, o expo-router já abriu o convite: não abra de novo.
    if (pathname.startsWith('/join') || pathname.startsWith('/i/')) return;
    router.navigate({ pathname: '/join', params: { code: token } });
  }, [ready, token, pathname]);
}
