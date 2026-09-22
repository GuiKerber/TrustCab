import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatCpf, PIX_TYPES, pixError, setPix, useProfile, type PixType } from '@/data/profile';
import { formatPhone } from '@trustcab/core';
import { Pills, spacing, TextField } from '@trustcab/ui';


// Tipo e chave Pix, com validação por tipo. Usado em Chave Pix e no primeiro acesso.
// "save" valida e grava; devolve true quando deu certo.
export function usePixForm({ onChange }: { onChange?: () => void } = {}) {
  const profile = useProfile();
  const [type, setType] = useState<PixType>(profile.pix?.type ?? 'cpf');
  const [key, setKey] = useState(profile.pix?.key ?? '');
  const [error, setError] = useState<string | null>(null);

  const format = (value: string, current: PixType) => (current === 'cpf' ? formatCpf(value) : current === 'phone' ? formatPhone(value) : value);

  const save = () => {
    const problem = pixError(type, key);
    setError(problem);
    if (problem) return false;
    setPix({ type, key: key.trim() });
    return true;
  };

  const clear = () => {
    setKey('');
    setError(null);
  };

  const fields = (
    <View style={styles.form}>
      <Pills
        items={(Object.keys(PIX_TYPES) as PixType[]).map((value) => ({ key: value, label: PIX_TYPES[value].label }))}
        selected={type}
        onSelect={(value) => {
          setType(value as PixType);
          clear();
          onChange?.();
        }}
        accessibilityLabel="Tipo de chave"
      />
      <TextField
        label={`Chave (${PIX_TYPES[type].label})`}
        value={key}
        onChangeText={(value) => {
          setKey(format(value, type));
          onChange?.();
          if (error) setError(null);
        }}
        placeholder={PIX_TYPES[type].placeholder}
        keyboardType={type === 'cpf' || type === 'phone' ? 'number-pad' : type === 'email' ? 'email-address' : 'default'}
        autoCapitalize="none"
        returnKeyType="done"
        onSubmitEditing={save}
        error={error ?? undefined}
        hint="Use a mesma chave cadastrada no app do seu banco."
      />
    </View>
  );

  return { fields, save, clear, type, key };
}

const styles = StyleSheet.create({
  form: { gap: spacing[20] },
});
