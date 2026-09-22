import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Block, Button, FormScreen, Label, spacing, Text } from '@trustcab/ui';
import { usePixForm } from '@/components/PixForm';
import { PIX_TYPES, setPix, useProfile } from '@/data/profile';

// Chave Pix: vai junto nas cobranças e gera o QR Code mostrado ao concluir a viagem.
export default function PixKey() {
  const profile = useProfile();
  const [saved, setSaved] = useState(false);
  const form = usePixForm({ onChange: () => setSaved(false) });

  return (
    <FormScreen
      backLabel="Voltar"
      onBack={() => router.back()}
      footer={
        <>
          <Button label={profile.pix ? 'Salvar nova chave' : 'Salvar chave'} icon="check" variant="light" onPress={() => setSaved(form.save())} />
          {profile.pix ? (
            <Button
              label="Remover chave"
              size="sm"
              variant="ghost"
              destructive
              style={styles.center}
              accessibilityHint="Sem chave Pix, você não consegue começar viagens nem cobrar"
              onPress={() => {
                setPix(null);
                form.clear();
                setSaved(false);
              }}
            />
          ) : null}
        </>
      }>
      <View style={styles.head}>
        <Text variant="display">Chave</Text>
        <Text variant="display" tone="secondary">
          Pix
        </Text>
        <Text variant="body" tone="secondary" style={styles.lead}>
          Vai junto nas cobranças do mês e vira o QR Code que o passageiro lê ao fim da viagem.
        </Text>
      </View>

      {form.fields}

      {saved && profile.pix ? (
        <Block style={styles.saved}>
          <Label>Salva</Label>
          <Text variant="bodyMedium" accessibilityLiveRegion="polite">
            {`${PIX_TYPES[profile.pix.type].label} · ${profile.pix.key}`}
          </Text>
        </Block>
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: spacing[4] },
  lead: { marginTop: spacing[12] },
  saved: { gap: spacing[4] },
  center: { alignSelf: 'center' },
});
