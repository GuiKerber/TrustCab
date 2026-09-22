import { Pressable, StyleSheet, View } from 'react-native';

import { borderWidth, colors, radius, size, spacing } from '../theme/tokens';

import { focusRing, stateOpacity, useInteraction } from './Button';
import { Icon, Text } from './ui';

// Caixa de seleção com texto. Estados: padrão, hover, foco, pressionado, marcada e desabilitada.
// A linha inteira é tocável; marcada mostra o ✓ (não depende só da cor).
export function Checkbox({
  label,
  hint,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const { hovered, focused, handlers } = useInteraction();

  return (
    <Pressable
      {...handlers}
      onPress={() => onChange(!checked)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={({ pressed }) => [styles.row, { opacity: stateOpacity({ pressed, hovered, disabled }) }, focused && focusRing()]}>
      <View style={[styles.box, checked ? styles.boxOn : hovered && styles.boxHover]}>
        {checked ? <Icon name="check" size={size.icon.sm} color={colors.ink} /> : null}
      </View>
      <View style={styles.text}>
        <Text variant="bodyMedium">{label}</Text>
        {hint ? (
          <Text variant="small" tone="secondary">
            {hint}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: size.touchTarget, flexDirection: 'row', alignItems: 'flex-start', gap: spacing[12], paddingVertical: spacing[8], borderRadius: radius.sm },
  box: {
    width: size.checkbox,
    height: size.checkbox,
    borderRadius: radius.sm,
    borderWidth: borderWidth.strong,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxHover: { borderColor: colors.text },
  boxOn: { backgroundColor: colors.text, borderColor: colors.text },
  text: { flex: 1, gap: spacing[2] },
});
