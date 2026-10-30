import type { AndroidSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, layout, radius, size, spacing } from '../theme/tokens';

import { focusRing, stateOpacity, useInteraction } from './Button';
import { Sheet } from './Sheet';
import { Icon, Label, Text } from './ui';

export type TripOption = {
  key: string;
  label: string;
  icon: AndroidSymbol;
  onPress: () => void;
  destructive?: boolean;
};

// Opções avançadas da viagem, abertas pelos três pontos.
export function TripOptions({
  visible,
  title,
  options,
  onClose,
  inline = false,
}: {
  visible: boolean;
  title: string;
  options: TripOption[];
  onClose: () => void;
  // Dentro de outra camada (o cartão ampliado) as opções entram por cima dela, sem abrir um segundo modal.
  inline?: boolean;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} closeLabel="Fechar opções" inline={inline}>
      <Label>{title}</Label>
      <View style={styles.list}>
        {options.map((option) => (
          <OptionRow
            key={option.key}
            option={option}
            onPress={() => {
              onClose();
              option.onPress();
            }}
          />
        ))}
      </View>
    </Sheet>
  );
}

function OptionRow({ option, onPress }: { option: TripOption; onPress: () => void }) {
  const { hovered, focused, handlers } = useInteraction();
  return (
    <Pressable
      {...handlers}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={option.label}
      style={({ pressed }) => [
        styles.option,
        { opacity: stateOpacity({ pressed, hovered, disabled: false }) },
        focused && focusRing(),
      ]}>
      <Icon name={option.icon} size={size.icon.lg} color={option.destructive ? colors.orange : colors.text} />
      <Text variant="bodyMedium" tone={option.destructive ? 'orange' : 'text'}>
        {option.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: layout.gap },
  option: {
    minHeight: size.row.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingHorizontal: spacing[16],
    borderRadius: radius.blockSm,
    backgroundColor: colors.surface,
  },
});
