import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, size, spacing } from '../theme/tokens';

import { focusRing, stateOpacity, useInteraction } from './Button';
import { joinedCorners } from './ListGroup';
import { Icon, Text } from './ui';

// Linha de total que abre o detalhe (gastos mês a mês na página do passageiro): o período, a
// contagem e o valor alinhados em coluna, e a seta. Dentro de um ListGroup, os cantos seguem a
// posição no grupo.
export function TotalRow({
  title,
  caption,
  count,
  value,
  onPress,
  accessibilityLabel,
  first = false,
  last = false,
}: {
  title: string;
  // Linha de apoio sob o título (ex.: "até hoje" no mês corrente).
  caption?: string;
  count: string;
  value: string;
  onPress: () => void;
  accessibilityLabel: string;
  first?: boolean;
  last?: boolean;
}) {
  const { hovered, focused, handlers } = useInteraction();
  return (
    <Pressable
      {...handlers}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.row,
        joinedCorners(first, last, radius.block, radius.joined),
        { opacity: stateOpacity({ pressed, hovered, disabled: false }) },
        focused && focusRing(),
      ]}>
      <View style={styles.title}>
        <Text variant="bodyMedium">{title}</Text>
        {caption ? (
          <Text variant="small" tone="secondary">
            {caption}
          </Text>
        ) : null}
      </View>
      <Text variant="small" tone="secondary" style={styles.number}>
        {count}
      </Text>
      <Text variant="bodyMedium" style={styles.number}>
        {value}
      </Text>
      <Icon name="chevron_right" size={size.icon.md} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: size.row.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    backgroundColor: colors.surface,
  },
  title: { flex: 1 },
  number: { fontVariant: ['tabular-nums'] },
});
