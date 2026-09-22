import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { colors, layout, size, spacing } from '../theme/tokens';

import { Button } from './Button';
import { Icon, Text } from './ui';

// Tela de erro: o que houve, o que fazer e "Tentar de novo". Sem internet tem texto próprio.
// Usada quando os dados não carregam e como proteção do app inteiro (ErrorBoundary do expo-router).
export function ErrorState({
  offline = false,
  detail,
  retrying = false,
  onRetry,
  onHome,
}: {
  offline?: boolean;
  // Mensagem técnica, só para quem reporta o problema. Fica pequena, embaixo.
  detail?: string;
  retrying?: boolean;
  onRetry: () => void;
  onHome?: () => void;
}) {
  return (
    <View style={styles.screen} accessibilityRole="alert">
      <Icon name={offline ? 'wifi_off' : 'error'} size={size.icon.xl} color={colors.orange} />
      <View style={styles.text}>
        <Text variant="displaySm">{offline ? 'Sem internet' : 'Não deu para carregar'}</Text>
        <Text variant="body" tone="secondary">
          {offline
            ? 'Confira o Wi-Fi ou os dados móveis. Quando a conexão voltar, toque em tentar de novo.'
            : 'Algo deu errado do nosso lado. Tente de novo; se continuar, feche e abra o app.'}
        </Text>
      </View>
      <View style={styles.actions}>
        <Button label="Tentar de novo" icon="refresh" variant="light" loading={retrying} onPress={onRetry} />
        <Button label="Voltar para o início" size="sm" variant="ghost" onPress={onHome ?? (() => router.replace('/'))} style={styles.center} />
      </View>
      {detail ? (
        <Text variant="label" tone="secondary" selectable>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', gap: spacing[20], padding: layout.screenPadding + spacing[4], backgroundColor: colors.ground },
  text: { gap: spacing[8] },
  actions: { gap: spacing[8] },
  center: { alignSelf: 'center' },
});
