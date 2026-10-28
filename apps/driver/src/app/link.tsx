import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { bookingShortUrl, shareLink } from '@trustcab/core';
import { rotateLink } from '@trustcab/core/db';
import { Banner, Block, Button, ConfirmDialog, FormScreen, Label, spacing, Text } from '@trustcab/ui';

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
  const url = slug ? bookingShortUrl(slug) : null;

  const gerar = async () => {
    setError(null);
    setBusy(true);
    try {
      await rotateLink();
      setConfirm(false);
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
          <Button
            label={busy ? 'Gerando…' : 'Gerar meu link'}
            icon="link"
            variant="light"
            disabled={busy || !phone || !uid}
            onPress={gerar}
          />
        )
      }>
      <View style={styles.head}>
        <Text variant="display">Seu link</Text>
        <Text variant="display" tone="secondary">
          de agenda
        </Text>
        <Text variant="body" tone="secondary" style={styles.lead}>
          Quem abre escolhe o dia e o horário entre os que você tem livres, deixa nome e WhatsApp, e o
          pedido cai aqui. Ninguém precisa instalar nada.
        </Text>
      </View>

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
        <Block style={styles.link}>
          <Label>Seu endereço</Label>
          <Text variant="heading" selectable accessibilityLiveRegion="polite">
            {url}
          </Text>
          <Text variant="small" tone="secondary">
            Toque e segure para copiar. Vale fixar no seu status e na descrição do seu WhatsApp.
          </Text>
        </Block>
      ) : null}

      {error ? (
        <Text variant="small" tone="orange" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <View style={styles.note}>
        <Label>O que aparece para quem abre</Label>
        <Text variant="small" tone="secondary">
          Seu nome, sua foto e seu carro. Seu telefone não fica escrito na página: ele só entra no botão
          que abre o WhatsApp depois que a pessoa pede. E os horários aparecem como livre ou cheio, sem o
          nome de ninguém.
        </Text>
      </View>

      <ConfirmDialog
        visible={confirm}
        title="Gerar outro link?"
        text="O endereço atual para de funcionar na hora, e quem abrir ele vai ler que o link saiu do ar. Quem já está combinado com você continua normalmente."
        confirmLabel={busy ? 'Gerando…' : 'Gerar outro'}
        confirmIcon="autorenew"
        onConfirm={gerar}
        onClose={() => setConfirm(false)}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: spacing[4] },
  lead: { marginTop: spacing[12] },
  link: { gap: spacing[4] },
  note: { paddingHorizontal: spacing[4], gap: spacing[4] },
  center: { alignSelf: 'center' },
});
