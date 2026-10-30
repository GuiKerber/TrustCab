import { StyleSheet, View } from 'react-native';

import { colors, size } from '../theme/tokens';

import { Text } from './ui';

// Inicial do passageiro num círculo com a cor dele. Decorativo: o nome sempre aparece ao lado.
export function Avatar({ name, color = colors.cards[0] }: { name: string; color?: string }) {
  return (
    <View style={[styles.avatar, { backgroundColor: color }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Text variant="bodyMedium" tone="onCard">
        {name.trim()[0]?.toUpperCase() ?? '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { width: size.avatar, height: size.avatar, borderRadius: size.avatar / 2, alignItems: 'center', justifyContent: 'center' },
});
