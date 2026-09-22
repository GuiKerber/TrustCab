import type { AndroidSymbol } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { colors, radius, size, spacing } from '../theme/tokens';

import { Button } from './Button';
import { Icon, Text } from './ui';

export type BannerAction = { label: string; icon?: AndroidSymbol; onPress: () => void };

// Aviso dentro da tela: o que houve, o que fazer e, se der, o botão que resolve.
// "warning" usa o laranja no ícone e no título (o texto nunca depende só da cor).
// "onCard" é a versão para cima dos cartões claros (folha da viagem).
export function Banner({
  icon,
  title,
  text,
  tone = 'default',
  onCard = false,
  actions = [],
}: {
  icon: AndroidSymbol;
  title: string;
  text?: string;
  tone?: 'default' | 'warning';
  onCard?: boolean;
  actions?: BannerAction[];
}) {
  const warning = tone === 'warning';
  const iconColor = onCard ? colors.ink : warning ? colors.orange : colors.textSecondary;

  return (
    <View style={[styles.banner, onCard ? styles.onCard : styles.onDark]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <View style={styles.row}>
        <Icon name={icon} size={size.icon.md} color={iconColor} />
        <View style={styles.text}>
          <Text variant="bodyMedium" tone={onCard ? 'onCard' : warning ? 'orange' : 'text'}>
            {title}
          </Text>
          {text ? (
            <Text variant="small" tone={onCard ? 'onCardMuted' : 'secondary'}>
              {text}
            </Text>
          ) : null}
        </View>
      </View>
      {actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map((action, index) => (
            <Button
              key={action.label}
              label={action.label}
              icon={action.icon}
              size="sm"
              variant={onCard ? (index === 0 ? 'ink' : 'ghost') : index === 0 ? 'light' : 'surface'}
              onCard={onCard}
              onPress={action.onPress}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: radius.block, padding: spacing[16], gap: spacing[12] },
  onDark: { backgroundColor: colors.surface },
  onCard: { backgroundColor: colors.tintOnCard },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[12] },
  text: { flex: 1, gap: spacing[2] },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8], paddingLeft: size.icon.md + spacing[12] },
});
