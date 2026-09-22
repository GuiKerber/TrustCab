import type { AndroidSymbol } from 'expo-symbols';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, radius, size, spacing } from '../theme/tokens';

import { focusRing, stateOpacity, useInteraction } from './Button';
import { Handle, Icon, Label, Text } from './ui';

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
  const insets = useSafeAreaInsets();

  const content = (
    <>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Fechar opções" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing[16] }]}>
        <Handle />
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
      </View>
    </>
  );

  if (inline) return visible ? <View style={styles.layer}>{content}</View> : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {content}
    </Modal>
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
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.ground,
    borderTopLeftRadius: radius.block,
    borderTopRightRadius: radius.block,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[12],
    gap: spacing[12],
  },
  list: { gap: layout.gap },
  option: {
    minHeight: size.button.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingHorizontal: spacing[16],
    borderRadius: radius.blockSm,
    backgroundColor: colors.surface,
  },
});
