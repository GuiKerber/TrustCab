import { Pressable, StyleSheet, View } from 'react-native';

import { borderWidth, colors, size, spacing } from '../theme/tokens';

import { focusRing, useInteraction } from './Button';
import { Icon, Text } from './ui';

export type ChipItem = { key: string; label: string; accessibilityLabel?: string };

// Escolha de várias opções ao mesmo tempo (ex.: dias da semana). Diferente das Pills, que escolhem uma só.
// Marcada: pílula clara com ✓ (não só a cor). Quebra linha em vez de rolar, para todas ficarem à vista.
export function ChipGroup({
  items,
  selected,
  onChange,
  accessibilityLabel,
  error,
}: {
  items: ChipItem[];
  selected: string[];
  onChange: (selected: string[]) => void;
  accessibilityLabel: string;
  // O que falta escolher e o que fazer.
  error?: string;
}) {
  const toggle = (key: string) => onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.group} accessibilityLabel={accessibilityLabel}>
        {items.map((item) => (
          <Chip key={item.key} item={item} selected={selected.includes(item.key)} onPress={() => toggle(item.key)} />
        ))}
      </View>
      {error ? (
        <View style={styles.error} accessibilityLiveRegion="polite">
          <Icon name="error" size={size.icon.sm} color={colors.orange} />
          <Text variant="small" tone="orange" style={styles.errorText}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function Chip({ item, selected, onPress }: { item: ChipItem; selected: boolean; onPress: () => void }) {
  const { hovered, focused, handlers } = useInteraction();
  return (
    <Pressable
      {...handlers}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={item.accessibilityLabel ?? item.label}
      style={({ pressed }) => [styles.chip, selected ? styles.chipOn : (pressed || hovered) && styles.chipActive, focused && focusRing()]}>
      {selected ? <Icon name="check" size={size.icon.sm} color={colors.ink} /> : null}
      <Text variant="bodyMedium" style={{ color: selected ? colors.ink : colors.text }}>
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing[8] },
  group: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8] },
  chip: {
    minWidth: size.pillMinWidth,
    height: size.touchTarget,
    paddingHorizontal: spacing[16],
    borderRadius: size.touchTarget / 2,
    borderWidth: borderWidth.hairline,
    borderColor: colors.lineStrong,
    // Fundo desde o início: no Android, pílula que ganha fundo depois pode perder o arredondamento.
    backgroundColor: colors.ground,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },
  chipOn: { backgroundColor: colors.text, borderColor: colors.text },
  chipActive: { backgroundColor: colors.surface },
  error: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[6] },
  errorText: { flex: 1 },
});
