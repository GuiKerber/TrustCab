import { useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolate, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { borderWidth, colors, gesture, motion, radius, spacing, spring } from '../theme/tokens';

import { focusRing, stateOpacity, useInteraction } from './Button';

// Onde o cartão estava na tela quando foi aberto: a folha da viagem cresce a partir daqui.
export type CardOrigin = { x: number; y: number; width: number; height: number };

export type StackSizes = {
  // Altura de cada cartão (o último aparece inteiro).
  card: number;
  // Quanto de cada cartão fica à mostra na pilha.
  peek: number;
};

type CardStackProps<T> = {
  items: T[];
  sizes: StackSizes;
  keyOf: (item: T) => string;
  colorOf: (item: T, index: number) => string;
  accessibilityLabelOf: (item: T) => string;
  accessibilityHint: string;
  renderCard: (item: T, info: { index: number; color: string; dark: boolean }) => ReactNode;
  onOpen: (item: T, color: string, origin: CardOrigin | null) => void;
};

// Pilha de cartões coloridos. Cada cartão mostra o topo; o último aparece inteiro.
// A pilha tem a altura do próprio conteúdo e fica dentro de uma tela que rola: com muitas viagens, a tela rola.
// Arrastar direto rola a tela. Segurar o cartão e puxar para cima revela o que está atrás do de baixo;
// puxar mais abre o cartão (ele cresce até a página da viagem). Tocar também abre.
export function CardStack<T>({ items, sizes, keyOf, colorOf, accessibilityLabelOf, accessibilityHint, renderCard, onOpen }: CardStackProps<T>) {
  const rest = items.length - 1;

  return (
    <View style={{ height: sizes.peek * rest + sizes.card }}>
      {items.map((item, index) => {
        const color = colorOf(item, index);
        return (
          <StackCard
            key={keyOf(item)}
            color={color}
            top={index * sizes.peek}
            height={sizes.card}
            accessibilityLabel={accessibilityLabelOf(item)}
            accessibilityHint={accessibilityHint}
            onOpen={(origin) => onOpen(item, color, origin)}>
            {renderCard(item, { index, color, dark: color === colors.cardDone })}
          </StackCard>
        );
      })}
    </View>
  );
}

function StackCard({
  color,
  top,
  height,
  accessibilityLabel,
  accessibilityHint,
  onOpen,
  children,
}: {
  color: string;
  top: number;
  height: number;
  accessibilityLabel: string;
  accessibilityHint: string;
  onOpen: (origin: CardOrigin | null) => void;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const lift = useSharedValue(0);
  const held = useSharedValue(0);
  const opening = useSharedValue(false);
  const ref = useRef<View>(null);
  const { hovered, focused, handlers } = useInteraction();
  const dark = color === colors.cardDone;

  const open = () => {
    const node = ref.current;
    if (!node) return onOpen(null);
    node.measureInWindow((x, y, width, h) => onOpen(width ? { x, y, width, height: h } : null));
  };

  // O puxar só começa depois de segurar o cartão (gesture.hold): arrastar direto continua rolando a tela.
  // Ao ativar, o cartão cresce um pouco para mostrar que "pegou". Até "reveal" ele acompanha o dedo e mostra
  // o que estava escondido; depois sobe com resistência e, passando de "expand", abre já durante o gesto.
  const pan = Gesture.Pan()
    .activateAfterLongPress(gesture.hold)
    .onStart(() => {
      held.value = reduceMotion ? 1 : withTiming(1, { duration: motion.fast });
    })
    .onUpdate((event) => {
      const pull = Math.min(event.translationY, 0);
      lift.value = pull > -gesture.reveal ? pull : -gesture.reveal + (pull + gesture.reveal) * gesture.resistance;
      if (pull < -gesture.expand && !opening.value) {
        opening.value = true;
        runOnJS(open)();
      }
    })
    .onFinalize(() => {
      opening.value = false;
      held.value = reduceMotion ? 0 : withTiming(0, { duration: motion.fast });
      lift.value = reduceMotion ? 0 : withSpring(0, spring);
    });

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { scale: interpolate(held.value, [0, 1], [1, gesture.holdScale]) }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View ref={ref} style={[styles.card, dark && styles.cardDark, { top, height, backgroundColor: color }, animated]}>
        <Pressable
          {...handlers}
          onPress={open}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          style={({ pressed }) => [
            styles.press,
            { opacity: stateOpacity({ pressed, hovered, disabled: false }) },
            focused && [focusRing(!dark), styles.focusInset],
          ]}>
          {children}
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  // Cartões escuros precisam de um contorno para a borda da pilha continuar visível.
  cardDark: { borderWidth: borderWidth.hairline, borderColor: colors.lineStrong },
  // O cartão corta o que passa da borda, então o anel de foco fica por dentro.
  focusInset: { outlineOffset: -spacing[6] },
  press: { flex: 1, borderRadius: radius.card, paddingHorizontal: spacing[20], paddingTop: spacing[16], paddingBottom: spacing[20] },
});
