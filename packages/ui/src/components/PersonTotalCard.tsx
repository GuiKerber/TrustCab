import { Pressable, StyleSheet, View } from 'react-native';

import { radius, size, spacing } from '../theme/tokens';

import { focusRing, stateOpacity, useInteraction } from './Button';
import { joinedCorners } from './ListGroup';
import { Text } from './ui';

// Cartão colorido com o total de uma pessoa no período (Ganhos). Tocar filtra a tela por ela.
// Cartões de cores diferentes, mesma tipografia. Dentro de um ListGroup, só as pontas arredondam.
export function PersonTotalCard({
  name,
  caption,
  total,
  color,
  onPress,
  accessibilityLabel,
  first = false,
  last = false,
}: {
  name: string;
  // Linha sob o nome (ex.: "40 viagens").
  caption: string;
  total: string;
  color: string;
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
        styles.card,
        joinedCorners(first, last, radius.block, radius.joined),
        { backgroundColor: color, opacity: stateOpacity({ pressed, hovered, disabled: false }) },
        focused && focusRing(),
      ]}>
      <View style={styles.text}>
        <Text variant="heading" tone="onCard" numberOfLines={1}>
          {name}
        </Text>
        <Text variant="small" tone="onCardMuted">
          {caption}
        </Text>
      </View>
      <Text variant="title" tone="onCard">
        {total}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: size.personCardMinHeight,
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
  },
  text: { flex: 1, gap: spacing[4] },
});
