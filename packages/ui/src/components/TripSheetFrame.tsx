import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatPrice, formatPriceShort, relativeDay, type Trip } from '@trustcab/core';
import { borderWidth, colors, gesture, motion, radius, size, spacing } from '../theme/tokens';

import { IconButton } from './Button';
import { CancelTripDialog } from './CancelTripDialog';
import type { CardOrigin } from './CardStack';
import { ROUTE_PALETTES, RouteMap, RouteNode, routeStep, type RouteTone } from './Route';
import { isClosed, routeProgress, statusLabel } from './TripBlocks';
import { TripOptions, type TripOption } from './TripOptions';
import { Handle, Icon, Label, Text, type Tone } from './ui';

// O que cada app desenha embaixo da folha, já com as cores certas para o fundo atual.
export type TripSheetFooterContext = {
  // Fundo escuro (viagem concluída ou cartão encerrado): texto claro.
  dark: boolean;
  onCard: boolean;
  tone: Tone;
  muted: Tone;
  // Variante do botão principal para este fundo.
  actionVariant: 'ink' | 'light';
  firstName: string;
};

export type TripSheetFrameProps = {
  trip: Trip | null;
  color: string;
  date: Date;
  now: Date;
  // Fica escondido (sem perder o estado) enquanto outra tela, como o chat, está por cima.
  visible: boolean;
  onClose: () => void;
  // Nome em destaque e linha de apoio (ex.: motorista vê o passageiro; passageiro vê quem dirige e o carro).
  person: string;
  personDetail?: string;
  // Primeiro ponto do percurso. Motorista: "Você · Sua localização". Passageiro: o motorista saindo.
  start?: { label: string; text: string };
  // Rótulo do tempo estimado. Motorista: "Chegada em" (quando chega ao destino). Passageiro: "Tempo de viagem".
  etaLabel?: string;
  onChat: (trip: Trip) => void;
  // Opções dos três pontos. "Cancelar viagem" entra no fim quando a viagem ainda vai acontecer.
  options: TripOption[];
  canCancel: boolean;
  onCancel: (trip: Trip) => void;
  // Viagem concluída: o que aparece no lugar do percurso (ex.: QR Code Pix do motorista, pagamento do passageiro).
  completedBody?: ReactNode;
  // Ações embaixo da folha, de cada app.
  footer: (context: TripSheetFooterContext) => ReactNode;
  // Cartão da pilha de onde a viagem foi aberta: a folha cresce a partir dele e volta para ele ao fechar.
  origin?: CardOrigin | null;
};

// O cartão ampliado, igual nos dois apps: sobe do rodapé com a mesma cor e mostra horário, pessoa, percurso,
// valor e tempo. Cada app só preenche as ações. Arrastar para baixo (ou tocar na seta) fecha.
export function TripSheetFrame({
  trip,
  color,
  date,
  now,
  visible,
  onClose,
  person,
  personDetail,
  start = { label: 'Você', text: 'Sua localização' },
  etaLabel,
  onChat,
  options,
  canCancel,
  onCancel,
  completedBody,
  footer,
  origin = null,
}: TripSheetFrameProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const offset = useSharedValue(height);
  const tripId = trip?.id;

  // 0 = do tamanho e no lugar do cartão de origem; 1 = folha aberta.
  const expand = useSharedValue(1);
  const grows = Boolean(origin) && !reduceMotion;

  useEffect(() => {
    if (!tripId) return;
    if (grows) {
      offset.value = 0;
      expand.value = 0;
      expand.value = withTiming(1, { duration: motion.slow });
    } else {
      expand.value = 1;
      offset.value = reduceMotion ? 0 : withTiming(0, { duration: motion.slow });
    }
    // Só quando outra viagem abre; mudar de estado não reabre a folha.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  // Fechar pela seta devolve a folha para o cartão; arrastar para baixo desliza para fora.
  const close = () => {
    if (reduceMotion) {
      offset.value = height;
      onClose();
      return;
    }
    if (origin) {
      expand.value = withTiming(0, { duration: motion.base }, (done) => {
        if (done) runOnJS(onClose)();
      });
      return;
    }
    offset.value = withTiming(height, { duration: motion.base }, (done) => {
      if (done) runOnJS(onClose)();
    });
  };

  const pan = Gesture.Pan()
    .activeOffsetY(gesture.activation)
    .onUpdate((event) => {
      offset.value = Math.max(event.translationY, 0);
    })
    .onEnd((event) => {
      if (event.translationY > gesture.closeThreshold) {
        offset.value = withTiming(height, { duration: motion.base }, (done) => {
          if (done) runOnJS(onClose)();
        });
      } else {
        offset.value = withTiming(0, { duration: motion.fast });
      }
    });

  // Ao concluir, o fundo passa da cor da viagem para o cinza do cartão encerrado. Trocar de viagem troca a cor sem animar.
  const completed = trip?.status === 'completed';
  const settled = useSharedValue(completed ? 1 : 0);
  const shownTrip = useRef(tripId);
  useEffect(() => {
    const target = completed ? 1 : 0;
    const sameTrip = shownTrip.current === tripId;
    shownTrip.current = tripId;
    settled.value = sameTrip && !reduceMotion ? withTiming(target, { duration: motion.slow }) : target;
  }, [completed, tripId, reduceMotion, settled]);

  const openTop = insets.top + spacing[16];
  const from = origin ?? { x: 0, y: openTop, width, height: height - openTop };
  const sheetStyle = useAnimatedStyle(() => ({
    top: interpolate(expand.value, [0, 1], [from.y, openTop]),
    left: interpolate(expand.value, [0, 1], [from.x, 0]),
    width: interpolate(expand.value, [0, 1], [from.width, width]),
    height: interpolate(expand.value, [0, 1], [from.height, height - openTop]),
    borderBottomLeftRadius: interpolate(expand.value, [0, 1], [radius.card, 0]),
    borderBottomRightRadius: interpolate(expand.value, [0, 1], [radius.card, 0]),
    transform: [{ translateY: offset.value }],
    backgroundColor: interpolateColor(settled.value, [0, 1], [color, colors.cardDone]),
  }));
  // O conteúdo da folha aparece na segunda metade do crescimento, quando já cabe.
  const contentStyle = useAnimatedStyle(() => ({ opacity: interpolate(expand.value, [0.45, 1], [0, 1], Extrapolation.CLAMP) }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: expand.value }));

  if (!trip) return null;

  // O cartão de uma viagem já encerrada é escuro; o texto passa a ser claro.
  const dark = color === colors.cardDone || completed;
  const price = trip.priceCents % 100 === 0 ? formatPriceShort(trip.priceCents) : formatPrice(trip.priceCents);
  const tone: Tone = dark ? 'text' : 'onCard';
  const muted: Tone = dark ? 'secondary' : 'onCardMuted';
  const buttonVariant = dark ? 'surface' : 'light';
  const actionVariant: 'ink' | 'light' = dark ? 'light' : 'ink';
  const onCard = !dark;
  const firstName = person.split(' ')[0];
  const closed = isClosed(trip);
  const step = routeStep(routeProgress(trip.status));
  const routeTone: RouteTone = dark ? 'onDark' : 'onCard';
  const palette = ROUTE_PALETTES[routeTone];
  const rail = (done: boolean) => (done ? palette.stroke : palette.faint);
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[styles.scrim, scrimStyle]} />
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              styles.sheet,
              dark && styles.sheetDark,
              { paddingBottom: insets.bottom + spacing[20] },
              sheetStyle,
            ]}>
            <Animated.View style={[styles.inner, contentStyle]}>
              <Handle color={dark ? colors.lineStrong : colors.inkLine} />

              <View style={styles.topRow}>
                <IconButton name="keyboard_arrow_down" label="Fechar detalhes" variant={buttonVariant} onCard={onCard} onPress={close} />
                <View style={styles.topActions}>
                  <IconButton name="chat" label={`Conversar com ${firstName}`} variant={buttonVariant} onCard={onCard} onPress={() => onChat(trip)} />
                  <IconButton name="more_horiz" label="Mais opções da viagem" variant={buttonVariant} onCard={onCard} onPress={() => setShowOptions(true)} />
                </View>
              </View>

              <View style={styles.headline}>
                <Label tone={muted}>{`${relativeDay(date, now)} · ${trip.status === 'scheduled' ? 'Agendada' : statusLabel(trip)}`}</Label>
                <Text variant="hero" tone={tone}>
                  {trip.time}
                </Text>
                <Text variant="heading" tone={tone}>
                  {person}
                </Text>
                {personDetail ? (
                  <Text variant="small" tone={muted}>
                    {personDetail}
                  </Text>
                ) : null}
              </View>

              {completed && completedBody ? (
                completedBody
              ) : (
                <>
                  <View style={styles.route}>
                    <View style={styles.timeline}>
                      <Stop label={start.label} text={start.text} reached rail={rail(step >= 1)} routeTone={routeTone} background={color} tone={tone} muted={muted} />
                      <Leg first={rail(step >= 1)} second={rail(step >= 2)} label={step === 1 ? 'A caminho' : undefined} tone={tone} dot={palette.stroke} />
                      <Stop label="Partida" text={trip.origin} reached={step >= 2} rail={rail(step >= 3)} routeTone={routeTone} background={color} tone={tone} muted={muted} />
                      <Leg first={rail(step >= 3)} second={rail(step >= 4)} label={step === 3 ? 'Em viagem' : undefined} tone={tone} dot={palette.stroke} />
                      <Stop label="Destino" text={trip.destination} reached={step >= 4} routeTone={routeTone} background={color} tone={tone} muted={muted} />
                    </View>
                    <RouteMap progress={routeProgress(trip.status)} tone={routeTone} cardColor={color} />
                  </View>

                  <View style={[styles.metrics, { borderTopColor: dark ? colors.lineStrong : colors.inkLine }]}>
                    <View style={styles.metric}>
                      <Label tone={muted}>Valor combinado</Label>
                      <Text variant="displaySm" tone={tone} numberOfLines={1}>
                        {price}
                      </Text>
                    </View>
                    <View style={styles.metric}>
                      <Label tone={muted}>{etaLabel ?? (closed ? 'Tempo estimado' : 'Chegada em')}</Label>
                      <Text variant="displaySm" tone={tone}>
                        {`${trip.etaMinutes} min`}
                      </Text>
                    </View>
                  </View>
                </>
              )}

              {footer({ dark, onCard, tone, muted, actionVariant, firstName })}
            </Animated.View>
          </Animated.View>
        </GestureDetector>
        <TripOptions
          inline
          visible={showOptions}
          title={`${trip.time} · ${person}`}
          options={[
            ...options,
            ...(!canCancel || closed
              ? []
              : [{ key: 'cancel', label: 'Cancelar viagem', icon: 'cancel' as const, destructive: true, onPress: () => setCancelling(true) }]),
          ]}
          onClose={() => setShowOptions(false)}
        />
        <CancelTripDialog
          trip={cancelling ? trip : null}
          other={person}
          onClose={() => setCancelling(false)}
          onConfirm={(target) => {
            setCancelling(false);
            onCancel(target);
          }}
        />
      </GestureHandlerRootView>
    </Modal>
  );
}

// Ponto da linha do tempo. "rail" continua a linha abaixo do nó até o próximo trecho.
function Stop({
  label,
  text,
  reached,
  rail,
  routeTone,
  background,
  tone,
  muted,
}: {
  label: string;
  text: string;
  reached: boolean;
  rail?: string;
  routeTone: RouteTone;
  background: string;
  tone: Tone;
  muted: Tone;
}) {
  return (
    <View style={styles.stop}>
      <View style={styles.rail}>
        <RouteNode reached={reached} tone={routeTone} background={background} />
        {rail ? <View style={[styles.railPart, { backgroundColor: rail }]} /> : null}
      </View>
      <View style={styles.stopText}>
        <Label tone={muted}>{label}</Label>
        <Text variant="small" tone={tone} numberOfLines={2}>
          {text}
        </Text>
      </View>
    </View>
  );
}

// Trecho entre dois pontos. Quando a seta está nele, aparece um ponto no meio com o estado.
function Leg({ first, second, label, tone, dot }: { first: string; second: string; label?: string; tone: Tone; dot: string }) {
  return (
    <View style={styles.leg}>
      <View style={styles.rail}>
        <View style={[styles.railPart, { backgroundColor: first }]} />
        {label ? <View style={[styles.railDot, { backgroundColor: dot }]} /> : null}
        <View style={[styles.railPart, { backgroundColor: second }]} />
      </View>
      {label ? (
        <Text variant="small" tone={tone}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim },
  sheet: {
    position: 'absolute',
    borderRadius: radius.card,
    paddingHorizontal: spacing[20],
    paddingTop: spacing[8],
    overflow: 'hidden',
  },
  inner: { flex: 1, gap: spacing[16] },
  sheetDark: { borderWidth: borderWidth.hairline, borderColor: colors.lineStrong, borderBottomWidth: 0 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between' },
  topActions: { flexDirection: 'row', gap: spacing[8] },
  headline: { gap: spacing[4] },
  route: { flex: 1, minHeight: size.routeMinHeight, flexDirection: 'row', gap: spacing[12] },
  timeline: { flex: 1 },
  stop: { flexDirection: 'row', gap: spacing[12] },
  stopText: { flex: 1, gap: spacing[2], paddingTop: spacing[4], paddingBottom: spacing[6] },
  leg: { flex: 1, minHeight: spacing[12], flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  rail: { width: size.routeNode, alignSelf: 'stretch', alignItems: 'center' },
  railPart: { flex: 1, width: size.routeRail },
  railDot: { width: size.dot.md, height: size.dot.md, borderRadius: size.dot.md / 2 },
  metrics: { flexDirection: 'row', gap: spacing[16], borderTopWidth: borderWidth.hairline, paddingTop: spacing[16] },
  metric: { flex: 1, gap: spacing[4] },
});
