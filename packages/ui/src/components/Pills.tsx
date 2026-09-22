import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { colors, layout, radius, size, spacing } from '../theme/tokens';

import { focusRing, useInteraction } from './Button';
import { Text } from './ui';

export type PillItem = { key: string; label: string; accessibilityLabel?: string };

// Faixa horizontal de opções fundida ao fundo: só a escolhida ganha pílula clara (mesmo desenho da faixa de dias).
// Sem barra de rolagem: as pílulas cortadas na borda da tela mostram que há mais.
export function Pills({
  items,
  selected,
  onSelect,
  accessibilityLabel,
}: {
  items: PillItem[];
  selected: string;
  onSelect: (key: string) => void;
  accessibilityLabel: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.track}
      style={styles.scroll}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}>
      {items.map((item) => (
        <Pill key={item.key} item={item} selected={item.key === selected} onSelect={onSelect} />
      ))}
    </ScrollView>
  );
}

function Pill({ item, selected, onSelect }: { item: PillItem; selected: boolean; onSelect: (key: string) => void }) {
  const { hovered, focused, handlers } = useInteraction();
  return (
    <Pressable
      {...handlers}
      onPress={() => onSelect(item.key)}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={item.accessibilityLabel ?? item.label}
      style={({ pressed }) => [
        styles.pill,
        selected ? styles.pillSelected : (pressed || hovered) && styles.pillActive,
        focused && focusRing(),
      ]}>
      <Text variant="bodyMedium" style={{ color: selected ? colors.ink : colors.text }}>
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { marginHorizontal: -layout.screenPadding, flexGrow: 0 },
  track: { paddingHorizontal: layout.screenPadding, paddingVertical: spacing[4], gap: spacing[4] },
  pill: {
    minWidth: size.pillMinWidth,
    height: size.touchTarget,
    paddingHorizontal: spacing[16],
    borderRadius: size.touchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSelected: { backgroundColor: colors.text },
  pillActive: { backgroundColor: colors.surface },
});
