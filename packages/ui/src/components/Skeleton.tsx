import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { colors, layout, motion, opacity, radius, size, spacing, type } from '../theme/tokens';

// Forma cinza no lugar do conteúdo enquanto os dados chegam. Pulsa devagar; com "Remover animações", fica parada.
export function SkeletonBlock({
  width = '100%',
  height,
  round = false,
  rounded = radius.sm,
}: {
  width?: DimensionValue;
  height: number;
  round?: boolean;
  rounded?: number;
}) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    pulse.value = withRepeat(withTiming(opacity.pending, { duration: motion.pulse }), -1, true);
  }, [pulse, reduceMotion]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return <Animated.View style={[styles.block, { width, height, borderRadius: round ? height / 2 : rounded }, style]} />;
}

export type SkeletonLayout = 'home' | 'agenda' | 'list' | 'chat';

const HOME_CARDS = 3;
const LIST_ROWS = 5;
const PILLS = 4;
const GRID_CELLS = 35;

// Esqueleto de cada tela, com a mesma estrutura dela, para nada pular quando os dados chegam.
export function ScreenSkeleton({ layout: kind }: { layout: SkeletonLayout }) {
  return (
    <View style={styles.screen} accessible accessibilityLabel="Carregando" accessibilityState={{ busy: true }}>
      <View style={styles.top}>
        <SkeletonBlock width="30%" height={type.bodyMedium.lineHeight} />
        <SkeletonBlock width={size.iconButton.md} height={size.iconButton.md} round />
      </View>

      {kind === 'chat' ? (
        <View style={styles.rows}>
          {Array.from({ length: LIST_ROWS }, (_, i) => (
            <View key={i} style={styles.chatRow}>
              <SkeletonBlock width={size.iconButton.md} height={size.iconButton.md} round />
              <View style={styles.lines}>
                <SkeletonBlock width="45%" height={type.bodyMedium.lineHeight} />
                <SkeletonBlock width="80%" height={type.small.lineHeight} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <>
          <View style={styles.title}>
            <SkeletonBlock width="70%" height={type.display.lineHeight} rounded={radius.blockSm} />
            <SkeletonBlock width="45%" height={type.display.lineHeight} rounded={radius.blockSm} />
          </View>
          <View style={styles.pills}>
            {Array.from({ length: PILLS }, (_, i) =>
              kind === 'home' ? (
                <SkeletonBlock key={i} width={size.dayPillMinWidth} height={size.calendarCell} rounded={radius.block} />
              ) : (
                <SkeletonBlock key={i} width={size.pillMinWidth} height={size.button.sm} round />
              ),
            )}
          </View>
          {kind === 'agenda' ? (
            <View style={styles.grid}>
              {Array.from({ length: GRID_CELLS }, (_, i) => (
                <View key={i} style={styles.cell}>
                  <SkeletonBlock height={size.calendarCell} />
                </View>
              ))}
            </View>
          ) : kind === 'home' ? (
            <View style={{ height: size.stack.peek * (HOME_CARDS - 1) + size.stack.card }}>
              {Array.from({ length: HOME_CARDS }, (_, i) => (
                <View key={i} style={[styles.stackCard, { top: i * size.stack.peek }]}>
                  <SkeletonBlock height={size.stack.card} rounded={radius.card} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.rows}>
              {Array.from({ length: HOME_CARDS }, (_, i) => (
                <SkeletonBlock key={i} height={size.personCardMinHeight} rounded={radius.block} />
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.surface },
  screen: { flex: 1, paddingHorizontal: layout.screenPadding, paddingTop: spacing[8], gap: spacing[20], backgroundColor: colors.ground },
  top: { minHeight: layout.touchTarget, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { gap: spacing[8] },
  pills: { flexDirection: 'row', gap: spacing[4] },
  stackCard: { position: 'absolute', left: 0, right: 0 },
  rows: { gap: spacing[8] },
  chatRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[12], minHeight: size.personCardMinHeight },
  lines: { flex: 1, gap: spacing[6] },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, padding: spacing[2] },
});
