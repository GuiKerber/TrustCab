import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, colors, FormScreen, Icon, Label, size, spacing, Text } from '@trustcab/ui';
import { usePixForm } from '@/components/PixForm';
import { useVehicleForm } from '@/components/VehicleForm';
import { finishOnboarding, NOTIFICATIONS } from '@/data/profile';
import { openSystemSettings, requestNotificationPermission, type PermissionState } from '@/lib/notifications';

const STEPS = ['vehicle', 'pix', 'notifications'] as const;
type Step = (typeof STEPS)[number];

// O que o motorista recebe no celular (só os que ele pode ligar e desligar depois em Configurações).
const NOTIFY_LIST = Object.values(NOTIFICATIONS).map((n) => n.title);

// Primeiro acesso, logo depois do login com Google: carro, chave Pix e notificações.
// Cada passo pode ficar para depois; sem carro e Pix, a Home avisa e as viagens não começam.
export default function Onboarding() {
  const [step, setStep] = useState<Step>('vehicle');
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [asking, setAsking] = useState(false);
  const vehicle = useVehicleForm();
  const pix = usePixForm();
  const index = STEPS.indexOf(step);

  const next = () => {
    if (index === STEPS.length - 1) finishOnboarding();
    else setStep(STEPS[index + 1]);
  };
  const back = index > 0 ? () => setStep(STEPS[index - 1]) : undefined;

  const askPermission = async () => {
    setAsking(true);
    const status = await requestNotificationPermission().catch(() => 'denied' as const);
    setAsking(false);
    setPermission(status);
    if (status === 'granted' || status === 'unsupported') finishOnboarding();
  };

  const progress = (
    <Label>{`Passo ${index + 1} de ${STEPS.length}`}</Label>
  );

  if (step === 'notifications') {
    return (
      <FormScreen
        backLabel="Voltar para a chave Pix"
        onBack={back}
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
          <Text variant="display">Avisos</Text>
          <Text variant="display" tone="secondary">
            na hora certa
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

  const isVehicle = step === 'vehicle';
  const form = isVehicle ? vehicle : pix;

  return (
    <FormScreen
      backLabel="Voltar para o carro"
      onBack={back}
      trailing={progress}
      footer={
        <>
          <Button label="Salvar e continuar" icon="arrow_forward" variant="light" onPress={() => form.save() && next()} />
          <Button
            label="Fazer depois"
            size="sm"
            variant="ghost"
            onPress={next}
            style={styles.center}
            accessibilityHint="Você cadastra depois pelo Perfil. Até lá, não dá para começar viagens."
          />
        </>
      }>
      <View style={styles.head}>
        <Text variant="display">{isVehicle ? 'Seu' : 'Sua chave'}</Text>
        <Text variant="display" tone="secondary">
          {isVehicle ? 'carro' : 'Pix'}
        </Text>
        <Text variant="body" tone="secondary" style={styles.lead}>
          {isVehicle
            ? 'Quando você avisa que chegou, o passageiro recebe o modelo, a cor e a placa para te achar.'
            : 'Vira o QR Code que o passageiro lê ao fim da viagem e vai junto nas cobranças do mês.'}
        </Text>
      </View>
      {form.fields}
      <Text variant="small" tone="secondary">
        Carro e chave Pix são obrigatórios para começar viagens.
      </Text>
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
