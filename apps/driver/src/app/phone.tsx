import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatPhone, parsePhone } from '@trustcab/core';
import { setPhone } from '@trustcab/core/db';
import { Block, Button, FormScreen, Label, layout, spacing, Text, TextField } from '@trustcab/ui';

import { useDriver } from '@/data/driver';
import { goBack } from '@/lib/back';

// O WhatsApp do motorista. É o número que recebe o aviso de quem pediu pelo link, e é o número
// que abre quando o passageiro toca em "Avisar" na página. Sem ele o link não é gerado.
//
// Ele nunca aparece escrito na página de agendamento: entra só dentro do endereço do botão,
// depois que a pessoa manda o pedido.
export default function Phone() {
  const { uid, phone } = useDriver();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    if (carregado) return;
    if (phone) setValue(formatPhone(phone));
    setCarregado(true);
  }, [phone, carregado]);

  const salvar = async () => {
    setError(null);
    const digits = parsePhone(value);
    if (!digits) {
      setError('Confira o número. Use DDD + celular, como (41) 99876-5432.');
      return;
    }
    if (!uid) {
      setError('Entre na sua conta para salvar.');
      return;
    }
    setBusy(true);
    try {
      await setPhone(uid, digits);
      goBack('/profile');
    } catch {
      setError('Não deu para salvar. Confira sua internet e tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormScreen
      backLabel="Voltar"
      onBack={() => goBack('/profile')}
      footer={<Button label="Salvar" icon="check" variant="light" loading={busy} onPress={salvar} />}>
      <View style={styles.head}>
        <Text variant="display">Seu</Text>
        <Text variant="display" tone="secondary">
          WhatsApp
        </Text>
        <Text variant="body" tone="secondary" style={styles.lead}>
          É por aqui que o passageiro fala com você depois de marcar pelo link.
        </Text>
      </View>

      <TextField
        label="Número com DDD"
        value={value}
        onChangeText={(text) => setValue(formatPhone(text))}
        keyboardType="phone-pad"
        autoComplete="tel"
        placeholder="(41) 99876-5432"
        error={error ?? undefined}
      />

      <Block style={styles.note}>
        <Label>Quem vê</Label>
        <Text variant="small" tone="secondary">
          Só quem manda um pedido pelo seu link. O número não fica escrito na página, e ninguém
          consegue lê-lo só por abrir o endereço.
        </Text>
      </Block>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: layout.textInset },
  lead: { marginTop: spacing[12] },
  note: { gap: spacing[4] },
});
