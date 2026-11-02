import type { AndroidSymbol } from 'expo-symbols';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '../theme/tokens';

import { BackBar } from './BackBar';

// Tela com campos de texto. Trata o teclado igual no iOS e no Android (que roda de ponta a ponta e não encolhe sozinho):
// o conteúdo rola por cima dele, arrastar ou tocar fora fecha o teclado e a ação principal ("footer")
// fica sempre visível, logo acima do teclado.
export function FormScreen({
  backIcon = 'arrow_back',
  backLabel,
  onBack,
  footer,
  trailing,
  children,
}: {
  backIcon?: AndroidSymbol;
  // Sem "onBack" (ex.: primeiro passo do primeiro acesso), o topo não tem botão de voltar.
  backLabel?: string;
  onBack?: () => void;
  footer?: ReactNode;
  // Ação no canto direito do topo (ex.: "Pular").
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.topBar}>
        <BackBar onBack={onBack} backLabel={backLabel} backIcon={backIcon} trailing={trailing} />
      </View>
      <KeyboardAvoidingView style={styles.body} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  topBar: { paddingHorizontal: layout.screenPadding, paddingTop: spacing[8] },
  body: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: layout.screenPadding, paddingTop: spacing[20], paddingBottom: spacing[28], gap: spacing[20] },
  footer: { paddingHorizontal: layout.screenPadding, paddingTop: spacing[8], paddingBottom: spacing[8], gap: spacing[8], backgroundColor: colors.ground },
});
