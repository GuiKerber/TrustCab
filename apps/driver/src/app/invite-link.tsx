import { router } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { inviteCode, inviteShortUrl } from '@trustcab/core';
import { Block, Button, ConfirmDialog, FormScreen, Label, spacing, Text } from '@trustcab/ui';

import { renewInviteLink, useProfile } from '@/data/profile';

// Link de convite: um por motorista. Quem entra por ele pede para entrar na sua rede.
// Gerar um novo invalida o anterior (ex.: o link foi parar num grupo errado).
export default function InviteLink() {
  const { inviteToken } = useProfile();
  const [confirm, setConfirm] = useState(false);
  const [renewed, setRenewed] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const url = inviteShortUrl(inviteToken);

  const share = async () => {
    setShareError(null);
    try {
      await Share.share({ message: `Entre pelo meu link para marcar suas viagens comigo no TrustCab: ${url}` });
    } catch {
      setShareError('Não deu para abrir o compartilhamento. Toque e segure o link para copiar.');
    }
  };

  return (
    <FormScreen
      backLabel="Voltar para o perfil"
      onBack={() => router.back()}
      footer={
        <>
          <Button label="Compartilhar link" icon="share" variant="light" onPress={share} />
          <Button label="Gerar novo link" icon="autorenew" size="sm" variant="ghost" onPress={() => setConfirm(true)} style={styles.center} />
        </>
      }>
      <View style={styles.head}>
        <Text variant="display">Seu link</Text>
        <Text variant="display" tone="secondary">
          de convite
        </Text>
        <Text variant="body" tone="secondary" style={styles.lead}>
          Quem entra por ele pede para entrar na sua rede. Mande só para quem você conhece.
        </Text>
      </View>

      <Block style={styles.link}>
        <Label>{renewed ? 'Link novo' : 'Link atual'}</Label>
        <Text variant="heading" selectable accessibilityLiveRegion="polite">
          {url}
        </Text>
        <Text variant="small" tone="secondary">
          Toque e segure para copiar.
        </Text>
      </Block>

      {/* Quem instala o app pela loja sem tocar no link entra digitando este código. */}
      <Block style={styles.link}>
        <Label>Código do convite</Label>
        <Text variant="heading" selectable accessibilityLabel={`Código ${inviteCode(inviteToken).split('').join(' ')}`}>
          {inviteCode(inviteToken)}
        </Text>
        <Text variant="small" tone="secondary">
          Serve para quem já baixou o app e quer entrar sem o link.
        </Text>
      </Block>

      {renewed ? (
        <Text variant="small" tone="secondary" accessibilityLiveRegion="polite">
          O link anterior parou de funcionar. Quem já está na sua rede continua; convites pendentes precisam deste link novo.
        </Text>
      ) : null}
      {shareError ? (
        <Text variant="small" tone="orange" accessibilityLiveRegion="polite">
          {shareError}
        </Text>
      ) : null}

      <ConfirmDialog
        visible={confirm}
        title="Gerar um link novo?"
        text="O link atual para de funcionar na hora. Quem já está na sua rede continua; quem ainda não entrou vai precisar do link novo."
        confirmLabel="Gerar novo link"
        confirmIcon="autorenew"
        onConfirm={() => {
          renewInviteLink();
          setRenewed(true);
          setConfirm(false);
        }}
        onClose={() => setConfirm(false)}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: spacing[4] },
  lead: { marginTop: spacing[12] },
  link: { gap: spacing[4] },
  center: { alignSelf: 'center' },
});
