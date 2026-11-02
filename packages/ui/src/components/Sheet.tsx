import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, radius, spacing } from '../theme/tokens';

import { Handle } from './ui';

// Folha que sobe do rodapé, com a camada escura atrás. Base de toda confirmação, lista de opções e
// prévia: a alça, os cantos, a altura máxima e o respiro da área segura saem daqui, iguais em todas.
//
// Tocar fora ou no "voltar" do celular fecha — menos quando "dismissible" é falso (ex.: enquanto uma
// exclusão processa). "inline" desenha por cima de outra camada que já é modal (a folha da viagem),
// sem abrir um segundo Modal.
export function Sheet({
  visible,
  onClose,
  closeLabel,
  dismissible = true,
  inline = false,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  // O que o leitor de tela fala na camada escura ("Fechar opções", "Responder depois").
  closeLabel: string;
  dismissible?: boolean;
  inline?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const close = dismissible ? onClose : undefined;

  const content = (
    <View style={styles.layer}>
      <Pressable style={styles.scrim} onPress={close} accessibilityLabel={closeLabel} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing[16] }]} accessibilityViewIsModal>
        <Handle />
        {children}
      </View>
    </View>
  );

  if (inline) return visible ? content : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: colors.scrim },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: layout.sheetMaxHeight,
    backgroundColor: colors.ground,
    borderTopLeftRadius: radius.block,
    borderTopRightRadius: radius.block,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[12],
    gap: spacing[16],
  },
});
