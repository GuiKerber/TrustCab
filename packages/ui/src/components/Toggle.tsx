import { Pressable, StyleSheet, View } from 'react-native';

import { borderWidth, colors, radius, size, spacing } from '../theme/tokens';

import { focusRing, stateOpacity, useInteraction } from './Button';
import { Text } from './ui';

// Linha com texto e interruptor. Ligado = trilho claro e bolinha à direita, com "Ligado"/"Desligado" escrito
// (o estado nunca depende só da cor). A linha inteira é o alvo de toque.
export function Toggle({
  label,
  hint,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const { hovered, focused, handlers } = useInteraction();
  return (
    <Pressable
      {...handlers}
      onPress={() => onChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={({ pressed }) => [styles.row, { opacity: stateOpacity({ pressed, hovered, disabled }) }, focused && focusRing()]}>
      <View style={styles.text}>
        <Text variant="bodyMedium">{label}</Text>
        {hint ? (
          <Text variant="small" tone="secondary">
            {hint}
          </Text>
        ) : null}
      </View>
      <View style={styles.control}>
        <View style={[styles.track, value ? styles.trackOn : hovered && styles.trackHover]}>
          <View style={[styles.thumb, value ? styles.thumbOn : styles.thumbOff]} />
        </View>
        <Text variant="label" tone="secondary">
          {value ? 'Ligado' : 'Desligado'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: size.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
    paddingVertical: spacing[12],
    borderRadius: radius.sm,
  },
  text: { flex: 1, gap: spacing[2] },
  control: { alignItems: 'center', gap: spacing[4], minWidth: size.toggle.width },
  track: {
    width: size.toggle.width,
    height: size.toggle.height,
    borderRadius: size.toggle.height / 2,
    borderWidth: borderWidth.strong,
    borderColor: colors.textSecondary,
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
    backgroundColor: colors.ground,
  },
  trackHover: { borderColor: colors.text },
  trackOn: { backgroundColor: colors.text, borderColor: colors.text },
  thumb: { width: size.toggle.thumb, height: size.toggle.thumb, borderRadius: size.toggle.thumb / 2 },
  thumbOff: { alignSelf: 'flex-start', backgroundColor: colors.textSecondary },
  thumbOn: { alignSelf: 'flex-end', backgroundColor: colors.ink },
});
