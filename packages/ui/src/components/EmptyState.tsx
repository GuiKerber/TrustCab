import type { AndroidSymbol } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { colors, size, spacing } from '../theme/tokens';

import { Button } from './Button';
import { Icon, Text } from './ui';

// Lista vazia: um ícone, o que está vazio e o que fazer para deixar de estar.
// Nunca é só "nada aqui" — a segunda linha sempre diz o próximo passo.
export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: AndroidSymbol;
  title: string;
  text: string;
  action?: { label: string; icon?: AndroidSymbol; onPress: () => void };
}) {
  return (
    <View style={styles.wrapper}>
      <Icon name={icon} size={size.icon.xl} color={colors.textSecondary} />
      <View style={styles.text}>
        <Text variant="heading">{title}</Text>
        <Text variant="small" tone="secondary" style={styles.center}>
          {text}
        </Text>
      </View>
      {action ? <Button label={action.label} icon={action.icon} size="sm" variant="surface" onPress={action.onPress} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', paddingTop: spacing[40], paddingHorizontal: spacing[20], gap: spacing[16] },
  text: { alignItems: 'center', gap: spacing[4] },
  center: { textAlign: 'center' },
});
