import { StyleSheet, View } from 'react-native';

import { colors, Icon, Label, radius, size, spacing, Text } from '@trustcab/ui';

import type { Driver } from '@/data/sample';

// Quem te convidou, antes de entrar na rede: nome e carro. Não mostra telefone nem outros passageiros.
export function InviteCard({ driver }: { driver: Driver }) {
  return (
    <View style={styles.card} accessible accessibilityLabel={`Convite de ${driver.name}. ${driver.vehicle.model} ${driver.vehicle.color}, placa ${driver.vehicle.plate}`}>
      <Label tone="onCardMuted">Convite de</Label>
      <Text variant="displaySm" tone="onCard">
        {driver.name}
      </Text>
      <View style={styles.car}>
        <Icon name="directions_car" size={size.icon.md} color={colors.ink} />
        <Text variant="bodyMedium" tone="onCard">{`${driver.vehicle.model} ${driver.vehicle.color} · ${driver.vehicle.plate}`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.cards[0], borderRadius: radius.card, padding: spacing[20], gap: spacing[8], minHeight: size.statCardMinHeight, justifyContent: 'flex-end' },
  car: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
});
