import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, size, spacing } from '../theme/tokens';

import { TextButton } from './Button';
import { Icon, Text } from './ui';

// Login dos dois apps: marca, uma frase em três linhas e uma única ação em texto. Nada mais.
// Cada app passa a própria frase; o resto (sessão expirada, erro, modo de desenvolvimento) é igual.
export function LoginScreen({
  brand,
  headline,
  notice,
  error,
  busy = false,
  onSignIn,
  dev,
}: {
  // Nome lido pelo leitor de tela (ex.: "TrustCab Driver").
  brand: string;
  // Três linhas; a do meio fica apagada.
  headline: [string, string, string];
  // Por que a pessoa está aqui (sessão expirou, conta excluída).
  notice?: string | null;
  error?: string | null;
  busy?: boolean;
  onSignIn: () => void;
  // Só em desenvolvimento: entrar sem conta, com o motivo escrito.
  dev?: { text: string; onEnter?: () => void } | null;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        {/* Marca provisória até o logo existir. */}
        <View style={styles.brand} accessibilityRole="header" accessibilityLabel={brand}>
          <View style={styles.mark}>
            <Icon name="navigation" size={size.icon.md} color={colors.ink} />
          </View>
          <Text variant="bodyMedium">trustcab</Text>
        </View>

        <View style={styles.headline}>
          <Text variant="display">{headline[0]}</Text>
          <Text variant="display" tone="secondary">
            {headline[1]}
          </Text>
          <Text variant="display">{headline[2]}</Text>
        </View>

        <View style={styles.actions}>
          {notice ? (
            <Text variant="small" tone="secondary" accessibilityLiveRegion="polite">
              {notice}
            </Text>
          ) : null}
          <TextButton label="Entrar com Google" loading={busy} onPress={onSignIn} accessibilityHint="Abre o login da sua conta Google" />
          {error ? (
            <Text variant="small" tone="orange" accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          {dev ? (
            <View style={styles.dev}>
              <Text variant="small" tone="secondary">
                {dev.text}
              </Text>
              {dev.onEnter ? <TextButton label="Ver sem conta" muted onPress={dev.onEnter} accessibilityHint="Só em desenvolvimento" /> : null}
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  content: { flex: 1, paddingHorizontal: layout.screenPadding + spacing[4], paddingTop: spacing[20], paddingBottom: spacing[40] },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
  mark: {
    width: size.iconButton.sm,
    height: size.iconButton.sm,
    borderRadius: size.iconButton.sm / 2,
    backgroundColor: colors.cards[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: { marginTop: 'auto', marginBottom: 'auto' },
  actions: { gap: spacing[12] },
  dev: { gap: spacing[4], marginTop: spacing[20] },
});
