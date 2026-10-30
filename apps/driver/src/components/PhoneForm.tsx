import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatPhone, parsePhone } from '@trustcab/core';
import { setPhone } from '@trustcab/core/db';
import { spacing, TextField } from '@trustcab/ui';

import { useDriver } from '@/data/driver';

// O WhatsApp do motorista, como formulário reaproveitável.
//
// Ele é o único dado sem o qual o link não nasce — e o link é o produto inteiro. Por isso ele
// abre o primeiro acesso em vez de ficar esperando ser descoberto no meio do Perfil.
//
// "save" devolve uma promessa porque grava direto no banco, ao contrário de carro e Pix, que
// passam pelo perfil local antes.
export function usePhoneForm({ onChange }: { onChange?: () => void } = {}) {
  const { uid, phone, devSession } = useDriver();
  const [value, setValue] = useState(() => (phone ? formatPhone(phone) : ''));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // O número salvo pode chegar do banco depois que a tela abriu. Ele entra só se o campo ainda
  // estiver vazio: o que a pessoa já digitou não é apagado.
  useEffect(() => {
    if (phone) setValue((atual) => atual || formatPhone(phone));
  }, [phone]);

  const save = async () => {
    const digits = parsePhone(value);
    if (!digits) {
      setError('Confira o número. Use DDD + celular, como (41) 99876-5432.');
      return false;
    }
    // Sessão de demonstração não tem banco para gravar: o número vale só enquanto o app está aberto.
    if (devSession) return true;
    if (!uid) {
      setError('Entre na sua conta para salvar.');
      return false;
    }
    setBusy(true);
    try {
      await setPhone(uid, digits);
      return true;
    } catch {
      setError('Não deu para salvar agora. Confira sua internet e tente de novo.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const fields = (
    <View style={styles.form}>
      <TextField
        label="Número com DDD"
        value={value}
        onChangeText={(text) => {
          setValue(formatPhone(text));
          onChange?.();
          if (error) setError(null);
        }}
        keyboardType="phone-pad"
        autoComplete="tel"
        placeholder="(41) 99876-5432"
        returnKeyType="done"
        error={error ?? undefined}
        hint="É para onde vai o aviso de quem pedir carona pelo seu link."
      />
    </View>
  );

  return { fields, save, busy };
}

const styles = StyleSheet.create({
  form: { gap: spacing[16] },
});
