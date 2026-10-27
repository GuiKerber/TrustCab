import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { daysLeft, priceLabel, SUPPORT_PHONE, todayISO, TRIAL_DAYS } from '@trustcab/core';
import { Banner, Block, Button, colors, FormScreen, Icon, Label, size, spacing, Text } from '@trustcab/ui';

import { useDriver } from '@/data/driver';
import { sendTo } from '@/data/whatsapp';

// O que a mensalidade sustenta. Lista curta e concreta: nada de "recursos avançados".
const INCLUDED = [
  { icon: 'link' as const, text: 'Seu link recebendo pedidos, sem limite de passageiros' },
  { icon: 'event_available' as const, text: 'Sua agenda cheia ou livre aparecendo certo para quem marca' },
  { icon: 'request_quote' as const, text: 'A conta do mês de cada passageiro, pronta para cobrar' },
];

// O plano: um mês inteiro liberado, depois R$ 19,90 por mês.
//
// Vencer não tranca o app. O que para é a entrada de trabalho novo — o link deixa de aceitar
// pedido e ele não confirma agenda nova. O que já está combinado continua à mostra, ele continua
// avisando e concluindo as viagens e continua vendo o histórico. Tirar de alguém o acesso ao que
// essa pessoa construiu não faz ninguém pagar; só castiga.
export default function PlanScreen() {
  const { name, plan, open } = useDriver();
  const [error, setError] = useState<string | null>(null);
  const today = todayISO();
  const left = daysLeft(plan, today);
  const price = priceLabel();

  const titulo = !open
    ? 'acabou'
    : plan.status === 'active'
      ? 'em dia'
      : left === 0
        ? 'acaba hoje'
        : left === 1
          ? 'acaba amanhã'
          : `${left} dias`;

  const falar = async () => {
    setError(null);
    if (!SUPPORT_PHONE) {
      setError('O WhatsApp de cobrança ainda não está configurado neste app.');
      return;
    }
    const result = await sendTo(
      SUPPORT_PHONE,
      `Oi! Aqui é o ${name}. Quero continuar com o TrustCab depois do mês grátis. Como faço para pagar?`,
    );
    if (!result.ok) setError(result.message);
  };

  return (
    <FormScreen
      backLabel="Voltar"
      onBack={() => router.back()}
      footer={
        plan.status === 'active' ? null : (
          <Button label="Falar sobre o pagamento" icon="chat" variant="light" onPress={falar} />
        )
      }>
      <View style={styles.head}>
        <Text variant="display">Seu mês</Text>
        <Text variant="display" tone="secondary">
          {titulo}
        </Text>
        <Text variant="body" tone="secondary" style={styles.lead}>
          {plan.status === 'active'
            ? `Sua assinatura está ativa. ${price} por mês.`
            : !open
              ? `O mês grátis acabou. Para o link voltar a receber pedidos, a assinatura é ${price} por mês.`
              : `Você tem ${TRIAL_DAYS} dias com tudo liberado para ver se funciona para você. Depois são ${price} por mês.`}
        </Text>
      </View>

      {!open ? (
        <Banner
          icon="lock"
          tone="warning"
          title="Seu link parou de receber pedidos"
          text="Quem abrir ele vê que você não está aceitando agora. Tudo o que já estava combinado continua valendo, e você continua avisando e concluindo as viagens."
        />
      ) : null}

      <View style={styles.list}>
        {INCLUDED.map((item) => (
          <View key={item.text} style={styles.item}>
            <Icon name={item.icon} size={size.icon.md} color={colors.text} />
            <Text variant="body" style={styles.itemText}>
              {item.text}
            </Text>
          </View>
        ))}
      </View>

      {error ? (
        <Text variant="small" tone="orange" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <Block style={styles.note}>
        <Label>Sem pegadinha</Label>
        <Text variant="small" tone="secondary">
          No mês grátis você não cadastra cartão nenhum. Se decidir não continuar, nada some: seus
          passageiros, sua agenda e seu histórico ficam aqui do mesmo jeito.
        </Text>
      </Block>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: spacing[4] },
  lead: { marginTop: spacing[12] },
  list: { gap: spacing[12], paddingHorizontal: spacing[4] },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  itemText: { flex: 1 },
  note: { gap: spacing[4] },
});
