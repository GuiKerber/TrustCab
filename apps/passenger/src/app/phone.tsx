import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatPhone } from '@trustcab/core';
import { Block, Button, FormScreen, Label, spacing, Text, TextField } from '@trustcab/ui';

import { setPhone, useProfile } from '@/data/profile';

// Celular do passageiro: opcional. Só os motoristas da sua rede veem, para te ligar se precisar.
export default function Phone() {
  const profile = useProfile();
  const [value, setValue] = useState(formatPhone(profile.phone));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = () => {
    const digits = value.replace(/\D/g, '');
    if (digits && (digits.length < 10 || digits.length > 11)) {
      setError('Confira o número: use DDD + celular, como (11) 98765-4321.');
      return;
    }
    setPhone(digits);
    setSaved(true);
  };

  return (
    <FormScreen
      backLabel="Voltar para o perfil"
      onBack={() => router.back()}
      footer={
        <>
          <Button label="Salvar celular" icon="check" variant="light" onPress={save} />
          {profile.phone ? (
            <Button
              label="Remover celular"
              size="sm"
              variant="ghost"
              destructive
              style={styles.center}
              onPress={() => {
                setPhone('');
                setValue('');
                setSaved(false);
              }}
            />
          ) : null}
        </>
      }>
      <View style={styles.head}>
        <Text variant="display">Seu</Text>
        <Text variant="display" tone="secondary">
          celular
        </Text>
        <Text variant="body" tone="secondary" style={styles.lead}>
          Opcional. Só os motoristas da sua rede veem, para te ligar se precisar.
        </Text>
      </View>
      <TextField
        label="Celular"
        value={value}
        onChangeText={(next) => {
          setValue(formatPhone(next));
          setError(null);
          setSaved(false);
        }}
        placeholder="(11) 98765-4321"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        returnKeyType="done"
        onSubmitEditing={save}
        error={error ?? undefined}
      />
      {saved ? (
        <Block style={styles.saved}>
          <Label>Salvo</Label>
          <Text variant="bodyMedium" accessibilityLiveRegion="polite">
            {profile.phone ? formatPhone(profile.phone) : 'Sem celular'}
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
