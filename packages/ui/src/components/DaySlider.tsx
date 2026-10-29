import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { fullDate, isSameDay, type Day } from '@trustcab/core';
import { colors, layout, radius, size, spacing } from '../theme/tokens';

import { focusRing, useInteraction } from './Button';
import { Text } from './ui';

const WEEKDAY = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

type DaySliderProps = {
  days: Day[];
  selected: Date;
  today: Date;
  onSelect: (date: Date) => void;
};

// Faixa de dias fundida ao fundo: só o dia escolhido ganha pílula clara.
export function DaySlider({ days, selected, today, onSelect }: DaySliderProps) {
  const faixa = useRef<ScrollView>(null);
  // Com duas semanas na faixa, o dia escolhido pode nascer fora da tela: a Home abriria mostrando
  // os primeiros dias e nada marcado. Assim que ele é medido, a faixa anda até ele.
  const jaAndou = useRef(false);
  const trazerParaDentro = (x: number) => {
    if (jaAndou.current) return;
    jaAndou.current = true;
    faixa.current?.scrollTo({ x: Math.max(0, x - layout.screenPadding), animated: false });
  };

  return (
    <ScrollView
      ref={faixa}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.track}
      style={styles.scroll}>
      {days.map((day) => {
        const escolhido = isSameDay(day.date, selected);
        return (
          <DayPill
            key={day.date.toISOString()}
            day={day}
            selected={escolhido}
            isToday={isSameDay(day.date, today)}
            onSelect={onSelect}
            onMeasure={escolhido ? trazerParaDentro : undefined}
          />
        );
      })}
    </ScrollView>
  );
}

function DayPill({
  day,
  selected,
  isToday,
  onSelect,
  onMeasure,
}: {
  day: Day;
  selected: boolean;
  isToday: boolean;
  onSelect: (date: Date) => void;
  onMeasure?: (x: number) => void;
}) {
  const { hovered, focused, handlers } = useInteraction();
  const { date, trips } = day;
  return (
    <Pressable
      {...handlers}
      onLayout={onMeasure ? (event) => onMeasure(event.nativeEvent.layout.x) : undefined}
      onPress={() => onSelect(date)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${isToday ? 'Hoje, ' : ''}${fullDate(date)}, ${trips.length === 1 ? '1 viagem' : `${trips.length} viagens`}`}
      style={({ pressed }) => [
        styles.day,
        selected ? styles.daySelected : (pressed || hovered) && styles.dayActive,
        focused && focusRing(),
      ]}>
      <Text variant="bodyMedium" style={{ color: selected ? colors.ink : colors.text }}>
        {date.getDate()}
      </Text>
      <Text variant="small" style={{ color: selected ? colors.inkSecondary : colors.textSecondary }}>
        {isToday ? 'hoje' : WEEKDAY[date.getDay()]}
      </Text>
      {trips.length > 0 && !selected ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { marginHorizontal: -layout.screenPadding, flexGrow: 0 },
  track: { paddingHorizontal: layout.screenPadding, paddingVertical: spacing[4], gap: spacing[4] },
  day: {
    minWidth: size.dayPillMinWidth,
    height: size.touchTarget,
    paddingHorizontal: spacing[16],
    borderRadius: size.touchTarget / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
  },
  daySelected: { backgroundColor: colors.text },
  dayActive: { backgroundColor: colors.surface },
  dot: { width: size.dot.xs, height: size.dot.xs, borderRadius: size.dot.xs / 2, backgroundColor: colors.orange },
});
