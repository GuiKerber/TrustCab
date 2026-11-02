import type { AndroidSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, size, spacing } from '../theme/tokens';

import { focusRing, stateOpacity, useInteraction } from './Button';
import { joinedCorners } from './ListGroup';
import { Icon, Text } from './ui';

// Linha de lista em blocos conectados (Perfil). Dentro de um ListGroup, o grupo diz quem é a
// primeira e a última, e só elas arredondam as pontas.
// "pending" destaca o que ainda falta configurar (ícone + texto laranja, não só a cor).
export function ListRow({
  icon,
  title,
  value,
  pending = false,
  first = false,
  last = false,
  onPress,
  accessibilityHint,
}: {
  icon: AndroidSymbol;
  title: string;
  value: string;
  pending?: boolean;
  first?: boolean;
  last?: boolean;
  onPress: () => void;
  accessibilityHint?: string;
}) {
  const { hovered, focused, handlers } = useInteraction();

  return (
    <Pressable
      {...handlers}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${value}`}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.row,
        joinedCorners(first, last, radius.block, radius.joined),
        { opacity: stateOpacity({ pressed, hovered, disabled: false }) },
        focused && focusRing(),
      ]}>
      <Icon name={icon} size={size.icon.lg} color={colors.textSecondary} />
      <View style={styles.text}>
        <Text variant="bodyMedium">{title}</Text>
        <View style={styles.value}>
          {pending ? <Icon name="error" size={size.icon.sm} color={colors.orange} /> : null}
          <Text variant="small" tone={pending ? 'orange' : 'secondary'} numberOfLines={pending ? 2 : 1} style={styles.valueText}>
            {value}
          </Text>
        </View>
      </View>
      <Icon name="chevron_right" size={size.icon.md} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: size.row.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    backgroundColor: colors.surface,
  },
  text: { flex: 1, gap: spacing[4] },
  value: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  valueText: { flex: 1 },
});
