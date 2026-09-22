import { Pressable, StyleSheet, View } from 'react-native';

import { fullDate, isSameDay, startOfDay, type Day, type Trip } from '@trustcab/core';
import { borderWidth, colors, radius, size, spacing } from '../theme/tokens';

import { focusRing, useInteraction } from './Button';
import { Text } from './ui';

const WEEKDAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
const MAX_DOTS = 4;

// Cor da bolinha: cada viagem puxa a cor do seu cartão; cancelada fica apagada.
export function tripDotColor(trip: Trip, index: number) {
  return trip.status === 'cancelled' ? colors.lineStrong : colors.cards[index % colors.cards.length];
}

export function TripDots({ trips, dot = size.dot.sm }: { trips: Trip[]; dot?: number }) {
  const extra = trips.length - MAX_DOTS;
  return (
    <View style={styles.dots}>
      {trips.slice(0, MAX_DOTS).map((trip, index) => (
        <View key={trip.id} style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: tripDotColor(trip, index) }} />
      ))}
      {extra > 0 ? (
        <Text variant="label" tone="secondary">
          {`+${extra}`}
        </Text>
      ) : null}
    </View>
  );
}

type MonthGridProps = {
  days: Day[];
  selected: Date | null;
  today: Date;
  onSelect: (date: Date) => void;
};

// Mês em blocos: cada dia mostra o número e uma bolinha por viagem, na cor do cartão.
// Dia sem bolinha é dia livre.
export function MonthGrid({ days, selected, today, onSelect }: MonthGridProps) {
  const first = days[0]?.date;
  if (!first) return null;
  // A semana começa na segunda, como na agenda de quem dirige.
  const offset = (first.getDay() + 6) % 7;
  const todayStart = startOfDay(today);
  const todayColumn = (today.getDay() + 6) % 7;

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {WEEKDAYS.map((weekday, i) => (
          <View key={weekday} style={styles.weekday}>
            <Text variant="small" tone={i === todayColumn ? 'text' : 'secondary'}>
              {weekday}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {Array.from({ length: offset }, (_, i) => (
          <View key={`empty-${i}`} style={styles.slot} />
        ))}
        {days.map(({ date, trips }) => (
          <View key={date.toISOString()} style={styles.slot}>
            <DayCell
              date={date}
              trips={trips}
              isToday={isSameDay(date, today)}
              isSelected={selected ? isSameDay(date, selected) : false}
              isPast={date < todayStart}
              onSelect={onSelect}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function DayCell({
  date,
  trips,
  isToday,
  isSelected,
  isPast,
  onSelect,
}: {
  date: Date;
  trips: Trip[];
  isToday: boolean;
  isSelected: boolean;
  isPast: boolean;
  onSelect: (date: Date) => void;
}) {
  const { hovered, focused, handlers } = useInteraction();
  const count = trips.filter((trip) => trip.status !== 'cancelled').length;
  const summary = count === 0 ? 'dia livre' : count === 1 ? '1 viagem' : `${count} viagens`;

  return (
    <Pressable
      {...handlers}
      onPress={() => onSelect(date)}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${isToday ? 'Hoje, ' : ''}${fullDate(date)}, ${summary}`}
      style={({ pressed }) => [
        styles.cell,
        isToday && styles.cellToday,
        isSelected && styles.cellSelected,
        (pressed || hovered) && !isSelected && styles.cellActive,
        focused && focusRing(),
      ]}>
      <TripDots trips={trips} dot={size.dot.xs} />
      <Text variant="bodyMedium" style={{ color: isToday ? colors.orange : isPast ? colors.textSecondary : colors.text }}>
        {date.getDate()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing[6] },
  row: { flexDirection: 'row' },
  weekday: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: spacing[4] },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  slot: { width: `${100 / 7}%`, padding: spacing[2] },
  cell: {
    height: size.calendarCell,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing[6],
    gap: spacing[4],
  },
  cellToday: { borderWidth: borderWidth.strong, borderColor: colors.orange },
  cellSelected: { borderWidth: borderWidth.strong, borderColor: colors.text },
  cellActive: { backgroundColor: colors.surfaceRaised },
  dots: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], minHeight: size.dot.md },
});
