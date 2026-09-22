import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { borderWidth, colors, gradient, motion, radius, size } from '../theme/tokens';

// Posições da seta, em ordem: sua localização → a caminho → partida → em viagem → destino.
export const ROUTE_STEPS = ['location', 'toPickup', 'pickup', 'toDestination', 'destination'] as const;
export type RouteProgress = (typeof ROUTE_STEPS)[number];

export function routeStep(progress: RouteProgress) {
  return ROUTE_STEPS.indexOf(progress);
}

// "onCard": traços escuros sobre cartão claro. "onDark": traços claros sobre o cartão escuro (viagem encerrada).
export const ROUTE_PALETTES = {
  onCard: { stroke: colors.ink, faint: colors.inkFaint, halo: colors.inkLine, bubble: colors.tintOnCard, arrow: colors.ink },
  onDark: { stroke: colors.text, faint: colors.lineStrong, halo: colors.lineStrong, bubble: colors.surfaceRaised, arrow: colors.orange },
} as const;

export type RouteTone = keyof typeof ROUTE_PALETTES;

// Ilustração do percurso (desenho do Figma "TrustCab Driver", nó 1:5): uma rua grossa com cantos arredondados,
// que some nas pontas, e a seta de navegação num círculo claro andando por ela. Não é um mapa real.
// O desenho original tem 115 × 431 e estica só na altura; a seta e o círculo não distorcem.
// Os números abaixo são coordenadas da ilustração, não medidas de interface.
const ART = { width: 115, height: 431 };
const PATH = [
  ['M', 108, 0],
  ['V', 36.4761],
  ['C', 108, 41.4701, 105.668, 46.1777, 101.695, 49.2039],
  ['L', 13.3045, 116.536],
  ['C', 9.33184, 119.562, 7, 124.27, 7, 129.264],
  ['V', 175.584],
  ['C', 7, 181.93, 10.75, 187.676, 16.5587, 190.231],
  ['L', 52.715, 206.132],
  ['C', 58.5236, 208.687, 62.2736, 214.433, 62.2736, 220.778],
  ['V', 350.128],
  ['C', 62.2736, 356.473, 66.0237, 362.219, 71.8323, 364.774],
  ['L', 98.4413, 376.477],
  ['C', 104.25, 379.031, 108, 384.777, 108, 391.123],
  ['V', 431],
] as const;

// Onde a seta fica em cada passo (x, y no desenho) e para onde aponta (graus, 0 = para cima).
const ARROW: Record<RouteProgress, { x: number; y: number; angle: number }> = {
  location: { x: 108, y: 22, angle: 180 },
  toPickup: { x: 57, y: 83, angle: 233 },
  pickup: { x: 62.3, y: 222, angle: 180 },
  toDestination: { x: 62.3, y: 300, angle: 180 },
  destination: { x: 108, y: 409, angle: 180 },
};

const BUBBLE = size.routeBubble;
const ARROW_PATH = 'M9.14 0 L18.28 20.13 L9.14 14.83 L0 20.13 Z';

// Estica só o eixo vertical do desenho para a altura disponível.
function scaledPath(scaleY: number) {
  return PATH.map(([command, ...values]) => {
    if (command === 'V') return `V${(values[0] * scaleY).toFixed(2)}`;
    const points = values.map((value, index) => (index % 2 === 0 ? value : value * scaleY).toFixed(2));
    return `${command}${points.join(' ')}`;
  }).join(' ');
}

export function RouteMap({ progress, tone, cardColor }: { progress: RouteProgress; tone: RouteTone; cardColor: string }) {
  const palette = ROUTE_PALETTES[tone];
  const reduceMotion = useReducedMotion();
  const [box, setBox] = useState({ width: 0, height: 0 });
  const scaleX = box.width / ART.width;
  const artHeight = scaleX ? box.height / scaleX : 0;
  const scaleY = artHeight / ART.height;

  const target = ARROW[progress];
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const angle = useSharedValue(target.angle);
  const measured = useRef(false);

  // Na primeira medida a seta já nasce no lugar; depois ela anda pelo percurso.
  useEffect(() => {
    if (!box.width) return;
    const toX = target.x * scaleX;
    const toY = target.y * scaleY * scaleX;
    const animate = measured.current && !reduceMotion;
    measured.current = true;
    const config = { duration: motion.slow };
    x.value = animate ? withTiming(toX, config) : toX;
    y.value = animate ? withTiming(toY, config) : toY;
    angle.value = animate ? withTiming(target.angle, config) : target.angle;
  }, [box.width, box.height, target.x, target.y, target.angle, scaleX, scaleY, reduceMotion, x, y, angle]);

  const bubbleStyle = useAnimatedStyle(() => ({ left: x.value - BUBBLE / 2, top: y.value - BUBBLE / 2 }));
  const arrowStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));

  return (
    <View
      style={styles.map}
      onLayout={(event) => setBox(event.nativeEvent.layout)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {box.width ? (
        <>
          <Svg width="100%" height="100%" viewBox={`0 0 ${ART.width} ${artHeight}`}>
            <Defs>
              {/* A rua some nas pontas: começa transparente, fica forte no meio e desbota no fim. */}
              <LinearGradient id="route-fade" x1="0" y1="0" x2="0" y2={artHeight} gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor={cardColor} stopOpacity={0} />
                <Stop offset={gradient.routeFade.start} stopColor={palette.stroke} stopOpacity={1} />
                <Stop offset={gradient.routeFade.end} stopColor={palette.stroke} stopOpacity={1} />
                <Stop offset="1" stopColor={cardColor} stopOpacity={gradient.routeFade.tail} />
              </LinearGradient>
            </Defs>
            <Path d={scaledPath(scaleY)} stroke="url(#route-fade)" strokeWidth={size.routeStroke} fill="none" />
          </Svg>
          <Animated.View style={[styles.bubble, { backgroundColor: palette.bubble }, bubbleStyle]}>
            <Animated.View style={arrowStyle}>
              <Svg width={size.icon.md} height={size.icon.md} viewBox="0 0 18.28 20.13">
                <Path d={ARROW_PATH} fill={palette.arrow} />
              </Svg>
            </Animated.View>
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

// Nó da linha do tempo: halo com um ponto no meio. Cheio quando o ponto já foi alcançado.
export function RouteNode({ reached, tone, background }: { reached: boolean; tone: RouteTone; background: string }) {
  const palette = ROUTE_PALETTES[tone];
  return (
    <View style={[styles.halo, { backgroundColor: palette.halo }]}>
      <View
        style={[
          styles.dot,
          reached ? { backgroundColor: palette.stroke } : { backgroundColor: background, borderWidth: borderWidth.strong, borderColor: palette.stroke },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  map: { width: size.routeMapWidth, alignSelf: 'stretch', overflow: 'visible' },
  bubble: {
    position: 'absolute',
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    width: size.routeNode,
    height: size.routeNode,
    borderRadius: size.routeNode / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: size.dot.lg, height: size.dot.lg, borderRadius: size.dot.lg / 2 },
});
