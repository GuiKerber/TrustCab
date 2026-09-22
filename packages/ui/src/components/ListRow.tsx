import type { AndroidSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, size, spacing } from '../theme/tokens';

import { focusRing, stateOpacity, useInteraction } from './Button';
import { Icon, Text } from './ui';

// Linha de lista em blocos conectados (Perfil). O primeiro e o último arredondam as pontas do grupo.
// "pending" destaca o que ainda falta configurar (ícone + texto laranja, não só a cor).
export function ListRow({
  icon,
  title,
  value,
  pending = false,
  first,
  last,
  onPress,
  accessibilityHint,
}: {
  icon: AndroidSymbol;
  title: string;
  value: string;
  pending?: boolean;
  first: boolean;
  last: boolean;
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
        first && styles.first,
        last && styles.last,
        { opacity: stateOpacity({ pressed, hovered, disabled: false }) },
        focused && focusRing(),
      ]}>
      <Icon name={icon} size={size.icon.lg} color={colors.textSecondary} />
      <View style={styles.text}>
        <Text variant="bodyMedium">{title}</Text>
        <View style={styles.value}>
          {pending ? <Icon name="error" size={size.icon.sm} color={colors.orange} /> : null}
          <Text variant="small" tone={pending ? 'orange' : 'secondary'} numberOfLines={1} style={styles.valueText}>
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
    minHeight: size.button.md + spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    backgroundColor: colors.surface,
    borderRadius: radius.joined,
  },
  first: { borderTopLeftRadius: radius.block, borderTopRightRadius: radius.block },
  last: { borderBottomLeftRadius: radius.block, borderBottomRightRadius: radius.block },
  text: { flex: 1, gap: spacing[2] },
  value: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  valueText: { flex: 1 },
});
