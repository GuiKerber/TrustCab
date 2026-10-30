import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { bookingShortUrl, shareLink } from '@trustcab/core';
import { rotateLink } from '@trustcab/core/db';
import { Banner, Button, ConfirmDialog, FormScreen, InfoBlock, InlineNotice, PageHeader, Text, Toast } from '@trustcab/ui';

import { useDriver } from '@/data/driver';
import { shareText } from '@/data/whatsapp';
import { goBack } from '@/lib/back';

// O link de agendamento. É um só, permanente, e é a porta de entrada do produto inteiro: o
// motorista fixa no WhatsApp, e quem abre marca a carona sem instalar nada.
//
// Gerar outro link desativa o anterior na hora. Serve para quando o endereço foi parar num grupo
// onde não devia — e é por isso que a confirmação diz exatamente isso, em vez de "tem certeza?".
export default function LinkScreen() {
  const { uid, name, phone, slug } = useDriver();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const url = slug ? bookingShortUrl(slug) : null;

  const gerar = async () => {
    setError(null);
    setBusy(true);
    const tinha = Boolean(slug);
    try {
      await rotateLink();
      setConfirm(false);
      // Sem este aviso a pessoa toca no botão, o endereço muda sozinho na tela e ela não tem
      // como saber se foi ela que fez aquilo — nem que o link antigo acabou de morrer.
      setAviso(tinha ? 'Link novo criado. O anterior parou de funcionar.' : 'Seu link está pronto.');
    } catch {
      setError('Não deu para gerar o link agora. Confira sua internet e tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  const compartilhar = async () => {
    if (!slug) return;
    setError(null);
    const result = await shareText(shareLink(name.split(' ')[0] || 'seu motorista', slug));
    if (!result.ok) setError(result.message);
  };

  return (
    <FormScreen
      backLabel="Voltar para o perfil"
      onBack={() => goBack('/profile')}
      footer={
        url ? (
          <>
            <Button label="Mandar no WhatsApp" icon="share" variant="light" onPress={compartilhar} />
            <Button
              label="Gerar outro link"
              icon="autorenew"
              size="sm"
              variant="ghost"
              onPress={() => setConfirm(true)}
              style={styles.center}
            />
          </>
        ) : (
          <Button label="Gerar meu link" icon="link" variant="light" loading={busy} disabled={!phone || !uid} onPress={gerar} />
        )
      }>
      <PageHeader
        title="Seu link"
        subtitle="de agenda"
        lead="Mande este link para quem anda com você. A pessoa escolhe o dia e o horário, e você confirma."
      />

      {!phone ? (
        <Banner
          icon="error"
          tone="warning"
          title="Falta seu WhatsApp"
          text="É por ele que o passageiro fala com você depois de pedir. Sem o número, o link não sai."
          actions={[{ label: 'Cadastrar agora', icon: 'edit', onPress: () => router.push('/phone') }]}
        />
      ) : null}

      {url ? (
        <InfoBlock label="Seu endereço" text="Toque e segure para copiar.">
          <Text variant="heading" selectable accessibilityLiveRegion="polite">
            {url}
          </Text>
        </InfoBlock>
      ) : null}

      {error ? <InlineNotice tone="warning" text={error} /> : null}

      <Toast message={aviso} onHide={() => setAviso(null)} />

      <ConfirmDialog
        visible={confirm}
        title="Gerar outro link?"
        text="O endereço atual para de funcionar na hora, e quem abrir ele vai ler que o link saiu do ar. Quem já está combinado com você continua normalmente."
        confirmLabel="Gerar outro"
        confirmIcon="autorenew"
        loading={busy}
        onConfirm={gerar}
        onClose={() => setConfirm(false)}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  center: { alignSelf: 'center' },
});
