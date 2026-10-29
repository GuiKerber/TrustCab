import type { AndroidSymbol } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { borderWidth, colors, layout, motion, radius, size, spacing } from '../theme/tokens';

import { Icon, Text } from './ui';

// Confirmação curta do que acabou de acontecer.
//
// Serve para ação que deu certo e não abre tela nenhuma — gerar um link novo, por exemplo: sem
// isto, a pessoa toca no botão, o endereço muda na tela e ela não tem como saber se foi ela que
// fez aquilo. O erro não vem por aqui: erro fica perto do controle que falhou, onde a pessoa
// ainda está olhando, e não some sozinho.
//
// Some sozinho depois de alguns segundos, e o leitor de tela anuncia sem roubar o foco.

const VISIBLE_MS = 4500;

export function Toast({
  message,
  icon = 'check_circle',
  onHide,
}: {
  message: string | null;
  icon?: AndroidSymbol;
  onHide: () => void;
}) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  const showing = Boolean(message);
  // O texto fica guardado enquanto o aviso sai de cena: sem isto ele esvazia no meio da saída.
  const [texto, setTexto] = useState(message);
  const [montado, setMontado] = useState(showing);
  // Quem usa passa onHide como função nova a cada render. Preso num ref, o relógio de alguns
  // segundos não volta à estaca zero toda vez que a tela se redesenha.
  const sumir = useRef(onHide);
  sumir.current = onHide;

  useEffect(() => {
    if (message) setTexto(message);
  }, [message]);

  useEffect(() => {
    const duracao = reduced ? 0 : motion.base;
    progress.value = withTiming(showing ? 1 : 0, { duration: duracao });
    if (showing) {
      setMontado(true);
      const relogio = setTimeout(() => sumir.current(), VISIBLE_MS);
      return () => clearTimeout(relogio);
    }
    // Enquanto a saída roda, o aviso continua na tela; tirando-o antes, ele some de uma vez.
    const saida = setTimeout(() => setMontado(false), duracao);
    return () => clearTimeout(saida);
  }, [showing, message, reduced, progress]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.value,
    // Sem movimento quando a pessoa pediu menos animação: só aparece e some.
    transform: [{ translateY: reduced ? 0 : (1 - progress.value) * spacing[12] }],
  }));

  if (!montado || !texto) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrapper, { bottom: insets.bottom + layout.scrollEnd }, animated]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert">
      <View style={styles.card}>
        <Icon name={icon} size={size.icon.md} color={colors.text} />
        <Text variant="small" style={styles.text}>
          {texto}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: layout.screenPadding, right: layout.screenPadding, alignItems: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    borderRadius: radius.block,
    backgroundColor: colors.surfaceRaised,
    borderWidth: borderWidth.hairline,
    borderColor: colors.line,
  },
  text: { flex: 1 },
});
