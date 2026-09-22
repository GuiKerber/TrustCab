import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatPhone } from '@trustcab/core';
import { openSystemSettings, requestNotificationPermission, type PermissionState } from '@trustcab/core/notifications';
import { Button, colors, FormScreen, Icon, Label, size, spacing, Text, TextField } from '@trustcab/ui';

import { finishOnboarding, NOTIFICATIONS, setPhone, useProfile } from '@/data/profile';

const STEPS = ['phone', 'notifications'] as const;
type Step = (typeof STEPS)[number];

const NOTIFY_LIST = Object.values(NOTIFICATIONS).map((n) => n.title);

// Primeiro acesso do passageiro, logo depois do login com Google: telefone (opcional) e notificações.
// As notificações são o coração do app (a caminho, chegou), então o pedido vem com a explicação antes.
export default function Onboarding() {
  const profile = useProfile();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhoneValue] = useState(profile.phone);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [asking, setAsking] = useState(false);
  const index = STEPS.indexOf(step);
  const progress = <Label>{`Passo ${index + 1} de ${STEPS.length}`}</Label>;

  const savePhone = () => {
    const digits = phone.replace(/\D/g, '');
    if (digits && (digits.length < 10 || digits.length > 11)) {
      setError('Confira o número: use DDD + celular, como (11) 98765-4321. Ou deixe em branco.');
      return;
    }
    setPhone(digits);
    setStep('notifications');
  };

  const askPermission = async () => {
    setAsking(true);
    const status = await requestNotificationPermission().catch(() => 'denied' as const);
    setAsking(false);
    setPermission(status);
    if (status === 'granted' || status === 'unsupported') finishOnboarding();
  };

  if (step === 'phone') {
    return (
      <FormScreen
        trailing={progress}
        footer={
          <>
            <Button label="Continuar" icon="arrow_forward" variant="light" onPress={savePhone} />
            <Button label="Pular" size="sm" variant="ghost" onPress={() => setStep('notifications')} style={styles.center} />
          </>
        }>
        <View style={styles.head}>
          <Text variant="display">Seu</Text>
          <Text variant="display" tone="secondary">
            celular
          </Text>
          <Text variant="body" tone="secondary" style={styles.lead}>
            Opcional. Com ele, seu motorista consegue te ligar se precisar. Só quem te leva vê o número.
          </Text>
        </View>
        <TextField
          label="Celular"
          value={phone}
          onChangeText={(value) => {
            setPhoneValue(formatPhone(value));
            setError(null);
          }}
          placeholder="(11) 98765-4321"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          returnKeyType="done"
          onSubmitEditing={savePhone}
          error={error ?? undefined}
        />
      </FormScreen>
    );
  }

  return (
    <FormScreen
      backLabel="Voltar para o celular"
      onBack={() => setStep('phone')}
      trailing={progress}
      footer={
        permission === 'denied' ? (
          <>
            <Button label="Abrir configurações do celular" icon="settings" variant="light" onPress={openSystemSettings} />
            <Button label="Continuar sem notificações" size="sm" variant="ghost" onPress={finishOnboarding} style={styles.center} />
          </>
        ) : (
          <>
            <Button label="Ativar notificações" icon="notifications" variant="light" loading={asking} onPress={askPermission} />
            <Button label="Agora não" size="sm" variant="ghost" onPress={finishOnboarding} style={styles.center} />
          </>
        )
      }>
      <View style={styles.head}>
        <Text variant="display">Saiba</Text>
        <Text variant="display" tone="secondary">
          quando descer
        </Text>
        <Text variant="body" tone="secondary" style={styles.lead}>
          O celular vai pedir sua permissão. Com ela, você fica sabendo de:
        </Text>
      </View>
      <View style={styles.list}>
        {NOTIFY_LIST.map((title) => (
          <View key={title} style={styles.item}>
            <Icon name="notifications" size={size.icon.md} color={colors.textSecondary} />
            <Text variant="bodyMedium">{title}</Text>
          </View>
        ))}
      </View>
      {permission === 'denied' ? (
        <Text variant="small" tone="orange" accessibilityLiveRegion="polite">
          As notificações ficaram bloqueadas. Para ativar, abra as configurações do celular e permita notificações do TrustCab.
        </Text>
      ) : (
        <Text variant="small" tone="secondary">
          Dá para escolher quais avisos receber depois, em Perfil → Configurações.
        </Text>
      )}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: spacing[4] },
  lead: { marginTop: spacing[12] },
  list: { gap: spacing[12] },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  center: { alignSelf: 'center' },
});
