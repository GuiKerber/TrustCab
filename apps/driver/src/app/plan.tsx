import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { formatPrice } from '@trustcab/core';
import { Button, colors, FormScreen, Icon, Label, size, spacing, Text } from '@trustcab/ui';

import { FREE_PASSENGERS, PRO_PRICE_CENTS } from '@/data/plan';
import { setPlan, useProfile } from '@/data/profile';

// O que o plano pago entrega. Lista curta e concreta: nada de "recursos avançados".
const INCLUDED = [
  { icon: 'group' as const, text: 'Passageiros sem limite na sua rede' },
  { icon: 'request_quote' as const, text: 'Cobrança do mês para quantos passageiros você tiver' },
  { icon: 'history' as const, text: 'Histórico e ganhos de todos eles, mês a mês' },
];

// Assinatura do motorista. O plano grátis não expira e não tira nada de quem já está na rede:
// ele só para de aceitar convite novo. Quem precisa de mais paga; quem não precisa, não paga.
export default function PlanScreen() {
  const { plan } = useProfile();
  const pro = plan === 'pro';
  const price = formatPrice(PRO_PRICE_CENTS);

  return (
    <FormScreen
      backLabel="Voltar"
      onBack={() => router.back()}
      footer={
        pro ? (
          <Button
            label="Voltar para o plano grátis"
            variant="surface"
            onPress={() => setPlan('free')}
            accessibilityHint={`Você continua com os passageiros que já tem; o limite de ${FREE_PASSENGERS} vale só para convite novo`}
          />
        ) : (
          <Button
            label={`Assinar por ${price} por mês`}
            icon="check"
            variant="light"
            onPress={() => setPlan('pro')}
            accessibilityHint="Libera convites sem limite"
          />
        )
      }>
      <View style={styles.head}>
        <Text variant="display">Rede</Text>
        <Text variant="display" tone="secondary">
          sem limite
        </Text>
        <Text variant="body" tone="secondary" style={styles.lead}>
          {`No plano grátis cabem ${FREE_PASSENGERS} passageiros. Passando disso, a assinatura libera quantos você quiser, por ${price} por mês.`}
        </Text>
      </View>

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

      {pro ? (
        <View style={styles.current} accessibilityLiveRegion="polite">
          <Icon name="check_circle" size={size.icon.md} color={colors.text} />
          <Text variant="bodyMedium" style={styles.itemText}>
            Sua assinatura está ativa.
          </Text>
        </View>
      ) : (
        <View style={styles.note}>
          <Label tone="secondary">Sem pegadinha</Label>
          <Text variant="small" tone="secondary">
            Cancelando, você fica com os passageiros que já tem. Nenhuma viagem e nenhum histórico some.
          </Text>
        </View>
      )}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: spacing[4] },
  lead: { marginTop: spacing[12] },
  list: { gap: spacing[12], paddingHorizontal: spacing[4] },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  itemText: { flex: 1 },
  current: { flexDirection: 'row', alignItems: 'center', gap: spacing[12], paddingHorizontal: spacing[4] },
  note: { paddingHorizontal: spacing[4], gap: spacing[4] },
});
