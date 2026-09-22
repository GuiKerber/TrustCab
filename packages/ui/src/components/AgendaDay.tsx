import { Pressable, StyleSheet, View } from 'react-native';

import { isSameDay, weekdayShort, type Trip } from '@trustcab/core';

import { borderWidth, colors, layout, radius, size, spacing } from '../theme/tokens';

import { focusRing, stateOpacity, useInteraction } from './Button';
import { tripDotColor } from './MonthGrid';
import { isClosed, statusLabel } from './TripBlocks';
import { Icon, Text } from './ui';

// Um dia da lista da Agenda: número e dia da semana à esquerda, as viagens do dia à direita.
// Dia sem viagem fica só com a borda. "personOf" escolhe o nome da viagem (passageiro ou motorista).
export function AgendaDay({
  date,
  trips,
  today,
  selected,
  personOf = (trip) => trip.passenger,
  onOpen,
}: {
  date: Date;
  trips: Trip[];
  today: Date;
  selected: boolean;
  personOf?: (trip: Trip) => string;
  onOpen: (trip: Trip, index: number) => void;
}) {
  const empty = trips.length === 0;
  const isToday = isSameDay(date, today);
  return (
    <View
      style={[styles.day, empty ? styles.dayEmpty : styles.dayFull, selected && styles.daySelected]}
      accessible
      accessibilityLabel={`${weekdayShort(date)}, ${date.getDate()}: ${
        empty ? 'sem viagens' : trips.map((trip) => `${trip.time} ${personOf(trip)}, ${statusLabel(trip)}`).join('; ')
      }`}>
      <View style={styles.dayHead}>
        <Text variant="display" tone={isToday ? 'orange' : 'text'}>
          {date.getDate()}
        </Text>
        <Text variant="small" tone="secondary">
          {isToday ? 'hoje' : weekdayShort(date)}
        </Text>
      </View>

      {empty ? (
        <View style={styles.free}>
          <View style={styles.freeDot} />
          <Text variant="small" tone="secondary">
            Sem viagens
          </Text>
        </View>
      ) : (
        <View style={styles.trips}>
          {trips.map((trip, index) => (
            <AgendaTrip key={trip.id} trip={trip} person={personOf(trip)} dot={tripDotColor(trip, index)} onPress={() => onOpen(trip, index)} />
          ))}
        </View>
      )}
    </View>
  );
}

// Um horário do dia. Tocar abre a folha da viagem. Encerrada ou esperando aprovação mostra o estado escrito.
function AgendaTrip({ trip, person, dot, onPress }: { trip: Trip; person: string; dot: string; onPress: () => void }) {
  const { hovered, focused, handlers } = useInteraction();
  const closed = isClosed(trip);
  const showStatus = closed || trip.status === 'requested';
  return (
    <Pressable
      {...handlers}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${trip.time}, ${person}, ${statusLabel(trip)}`}
      accessibilityHint="Abre os detalhes da viagem"
      style={({ pressed }) => [styles.trip, { opacity: stateOpacity({ pressed, hovered, disabled: false }) }, focused && focusRing()]}>
      <View style={[styles.tripDot, { backgroundColor: dot }]} />
      <View style={styles.tripText}>
        <Text variant="small" tone={closed ? 'secondary' : 'text'} numberOfLines={1}>
          {person}
        </Text>
        {showStatus ? (
          <Text variant="label" tone="secondary">
            {statusLabel(trip).toUpperCase()}
          </Text>
        ) : null}
      </View>
      <Text variant="bodyMedium" tone={closed ? 'secondary' : 'text'} style={styles.tripTime}>
        {trip.time}
      </Text>
      <Icon name="chevron_right" size={size.icon.md} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  day: {
    minHeight: size.agendaDayMinHeight,
    borderRadius: radius.block,
    padding: spacing[16],
    flexDirection: 'row',
    gap: spacing[16],
  },
  dayFull: { backgroundColor: colors.surface },
  dayEmpty: { borderWidth: borderWidth.hairline, borderColor: colors.line },
  daySelected: { borderWidth: borderWidth.strong, borderColor: colors.text },
  dayHead: { width: size.agendaDayNumber, gap: spacing[2] },
  free: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: spacing[8] },
  freeDot: { width: size.dot.xl, height: size.dot.xl, borderRadius: size.dot.xl / 2, backgroundColor: colors.surface, marginBottom: spacing[2] },
  trips: { flex: 1, gap: spacing[4], justifyContent: 'center' },
  trip: {
    minHeight: layout.touchTarget,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing[12],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  tripDot: { width: size.dot.md, height: size.dot.md, borderRadius: size.dot.md / 2 },
  tripText: { flex: 1 },
  tripTime: { fontVariant: ['tabular-nums'] },
});
