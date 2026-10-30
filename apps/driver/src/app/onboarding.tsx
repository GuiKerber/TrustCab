import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, colors, FormScreen, Icon, Label, layout, size, spacing, Text } from '@trustcab/ui';
import { usePhoneForm } from '@/components/PhoneForm';
import { usePixForm } from '@/components/PixForm';
import { useVehicleForm } from '@/components/VehicleForm';
import { finishOnboarding, NOTIFICATIONS } from '@/data/profile';
import { openSystemSettings, requestNotificationPermission, type PermissionState } from '@/lib/notifications';

const STEPS = ['phone', 'vehicle', 'pix', 'notifications'] as const;
type Step = (typeof STEPS)[number];

// O que o motorista recebe no celular (só os que ele pode ligar e desligar depois em Configurações).
const NOTIFY_LIST = Object.values(NOTIFICATIONS).map((n) => n.title);

// Primeiro acesso, logo depois do login com Google: WhatsApp, carro, chave Pix e notificações.
//
// Os três primeiros são obrigatórios, e o WhatsApp vem na frente de propósito: sem ele o link
// não é gerado, e o link é o produto. Deixar esse campo para o motorista descobrir sozinho no
// Perfil era mandar ele terminar a configuração sem conseguir usar o app.
export default function Onboarding() {
  const [step, setStep] = useState<Step>('phone');
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [asking, setAsking] = useState(false);
  const phone = usePhoneForm();
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
            Você fica sabendo de:
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

  const telas = {
    phone: { form: phone, titulo: 'Seu', destaque: 'WhatsApp', voltar: 'Voltar', lead: 'É por aqui que o passageiro fala com você depois de marcar pelo link. Sem ele, seu link não é gerado.' },
    vehicle: { form: vehicle, titulo: 'Seu', destaque: 'carro', voltar: 'Voltar para o WhatsApp', lead: 'Quando você avisa que chegou, o passageiro recebe o modelo, a cor e a placa para te achar.' },
    pix: { form: pix, titulo: 'Sua chave', destaque: 'Pix', voltar: 'Voltar para o carro', lead: 'Vira o QR Code que o passageiro lê ao fim da viagem e vai junto nas cobranças do mês.' },
  } as const;
  const atual = telas[step as keyof typeof telas];

  return (
    <FormScreen
      backLabel={atual.voltar}
      onBack={back}
      trailing={progress}
      footer={
        <Button
          label="Salvar e continuar"
          icon="arrow_forward"
          variant="light"
          onPress={async () => {
            if (await atual.form.save()) next();
          }}
        />
      }>
      <View style={styles.head}>
        <Text variant="display">{atual.titulo}</Text>
        <Text variant="display" tone="secondary">
          {atual.destaque}
        </Text>
        <Text variant="body" tone="secondary" style={styles.lead}>
          {atual.lead}
        </Text>
      </View>
      {atual.form.fields}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: layout.textInset },
  lead: { marginTop: spacing[12] },
  list: { gap: spacing[12] },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  center: { alignSelf: 'center' },
});
