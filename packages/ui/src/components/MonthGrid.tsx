import { Pressable, StyleSheet, View } from 'react-native';

import { fullDate, isSameDay, startOfDay, type Day, type Trip } from '@trustcab/core';
import { borderWidth, colors, radius, size, spacing } from '../theme/tokens';

import { focusRing, useInteraction } from './Button';
import { Text } from './ui';

const WEEKDAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
// Acima disto a célula mostra o número total, não bolinhas.
const MAX_DOTS = 3;

// Cor da bolinha: cada viagem puxa a cor do seu cartão; cancelada fica apagada.
export function tripDotColor(trip: Trip, index: number) {
  return trip.status === 'cancelled' ? colors.lineStrong : colors.cards[index % colors.cards.length];
}

// As bolinhas de um dia. Acima de um punhado elas param de informar e passam a atrapalhar: numa
// célula de calendário com cerca de 45px de largura, quatro bolinhas mais "+12" não cabem e
// vazam para fora do quadrado do dia. Passando do limite, o número sozinho diz mais e sempre cabe.
export function TripDots({ trips, dot = size.dot.md }: { trips: Trip[]; dot?: number }) {
  if (trips.length > MAX_DOTS) {
    return (
      <View style={styles.dots}>
        <Text variant="label" tone="secondary">
          {trips.length}
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.dots}>
      {trips.map((trip, index) => (
        <View key={trip.id} style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: tripDotColor(trip, index) }} />
      ))}
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
  wrapper: { gap: spacing[8] },
  row: { flexDirection: 'row' },
  weekday: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: spacing[4] },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  slot: { width: `${100 / 7}%`, padding: spacing[4] },
  cell: {
    height: size.calendarCell,
    borderRadius: radius.md,
    // Rede de segurança: nada desenhado dentro do dia escapa do quadrado dele.
    overflow: 'hidden',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  cellToday: { borderWidth: borderWidth.strong, borderColor: colors.orange },
  cellSelected: { borderWidth: borderWidth.strong, borderColor: colors.text },
  cellActive: { backgroundColor: colors.surfaceRaised },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[4], minHeight: size.dot.md, maxWidth: '100%' },
});
