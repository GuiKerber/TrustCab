import type { AndroidSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { borderWidth, colors, radius, size, spacing } from '../theme/tokens';

import { focusRing, useInteraction } from './Button';
import { Icon } from './ui';

// Só o que a barra usa do navegador, para não depender da tipagem interna do expo-router.
export type TabIcons = Record<string, { icon: AndroidSymbol; label: string }>;

type TabBarProps = {
  // Ícone e nome de cada aba, pelo nome da rota. Cada app passa as suas.
  tabs: TabIcons;
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
  descriptors: Record<string, { options: { tabBarBadge?: number | string } }>;
};

// Menu fundido ao fundo escuro, só com ícones. O item ativo ganha uma pílula clara.
export function FloatingTabBar({ tabs, state, navigation, descriptors }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + spacing[12] }]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const config = tabs[route.name];
        if (!config) return null;
        const focused = state.index === index;
        return (
          <TabItem
            key={route.key}
            icon={config.icon}
            label={config.label}
            selected={focused}
            badge={Boolean(descriptors[route.key]?.options.tabBarBadge)}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
          />
        );
      })}
    </View>
  );
}

function TabItem({
  icon,
  label,
  selected,
  badge,
  onPress,
}: {
  icon: AndroidSymbol;
  label: string;
  selected: boolean;
  badge: boolean;
  onPress: () => void;
}) {
  const { hovered, focused, handlers } = useInteraction();
  return (
    <Pressable
      {...handlers}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={styles.item}>
      {({ pressed }) => (
        <>
          <View
            style={[
              styles.slot,
              selected ? styles.slotOn : (pressed || hovered) && styles.slotActive,
              focused && focusRing(),
            ]}>
            <Icon name={icon} size={size.icon.lg} color={selected ? colors.ink : colors.textSecondary} />
          </View>
          {badge ? <View style={styles.badge} /> : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.ground,
    paddingTop: spacing[8],
    paddingHorizontal: spacing[12],
  },
  item: { minWidth: size.tabItem, minHeight: size.touchTarget, alignItems: 'center', justifyContent: 'center' },
  slot: {
    width: size.tabSlot.width,
    height: size.tabSlot.height,
    borderRadius: size.tabSlot.height / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotOn: { backgroundColor: colors.text },
  slotActive: { backgroundColor: colors.surface },
  badge: {
    position: 'absolute',
    top: spacing[6],
    right: spacing[12],
    width: size.badge,
    height: size.badge,
    borderRadius: size.badge / 2,
    backgroundColor: colors.orange,
    borderWidth: borderWidth.strong,
    borderColor: colors.ground,
  },
});
