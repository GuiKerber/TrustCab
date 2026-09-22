import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatPhone, formatPrice, formatPriceShort, longDate, monthName, useNow, useSyncState } from '@trustcab/core';
import { Banner, Block, Button, colors, ConfirmDialog, Icon, IconButton, Label, layout, radius, ScreenStatus, size, spacing, Text, TripOptions } from '@trustcab/ui';

import { TopBar } from '@/components/TopBar';
import { knownDrivers, leaveDriver, myDriver, undoLeave, useConnections } from '@/data/connections';
import { stopRoutine, useRoutines } from '@/data/routines';
import { fixedSlots, spentWith, weekdaysLabel } from '@/data/summary';
import { useMonthTrips } from '@/data/trips';

// Seu motorista (no MVP, um só): o carro para achar na rua, quanto você gastou no mês, seus horários com ele
// e as rotinas que renovam. Daqui você pede viagens, liga ou sai da rede. Sem motorista, mostra como entrar por convite.
export default function DriverTab() {
  const now = useNow();
  const sync = useSyncState();
  const connections = useConnections();
  const routines = useRoutines();
  const [options, setOptions] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [justLeft, setJustLeft] = useState<string | null>(null);
  const thisMonth = useMonthTrips(new Date(now.getFullYear(), now.getMonth(), 1), now);
  const nextMonth = useMonthTrips(new Date(now.getFullYear(), now.getMonth() + 1, 1), now);

  const driver = myDriver(connections, now);
  const leftDriver = justLeft ? (knownDrivers(connections, now).find((d) => d.id === justLeft) ?? null) : null;

  if (sync.state !== 'ready') return <ScreenStatus state={sync.state} layout="list" onRetry={sync.retry} />;

  if (!driver) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TopBar title="Motorista" />
          {leftDriver ? (
            <Banner
              icon="person_remove"
              title={`Você saiu da rede de ${leftDriver.name.split(' ')[0]}`}
              text="As viagens de hoje em diante saíram da sua agenda. O histórico continua em Gastos."
              actions={[
                {
                  label: 'Desfazer',
                  icon: 'undo',
                  onPress: () => {
                    undoLeave(leftDriver.id);
                    setJustLeft(null);
                  },
                },
              ]}
            />
          ) : null}
          <View style={styles.head}>
            <Text variant="display">Sem</Text>
            <Text variant="display" tone="secondary">
              motorista
            </Text>
            <Text variant="body" tone="secondary" style={styles.lead}>
              Só quem te convida pode te levar. Peça o link de convite para quem te leva, ou use o código do convite.
            </Text>
          </View>
          <Button label="Tenho um convite" icon="key" variant="light" onPress={() => router.push('/join')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const first = driver.name.split(' ')[0];
  const spent = spentWith(thisMonth, driver.name);
  const slots = fixedSlots([...thisMonth, ...nextMonth], driver.name, now);
  const renewing = routines
    .filter((r) => r.driverId === driver.id)
    .map((r) => ({ ...r, trips: r.trips.filter((t) => t.recurring) }))
    .filter((r) => r.trips.length > 0);
  const month = monthName(now);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TopBar title="Motorista" />

        <View style={styles.headRow}>
          <View style={styles.headText}>
            <Label>Seu motorista</Label>
            <Text variant="display">{driver.name}</Text>
            <Text variant="small" tone="secondary">{`Na sua rede desde ${longDate(driver.since)}`}</Text>
          </View>
          <IconButton name="more_horiz" label="Mais opções" onPress={() => setOptions(true)} />
        </View>

        <Block style={styles.car}>
          <Icon name="directions_car" size={size.icon.xl} color={colors.textSecondary} />
          <View style={styles.carText}>
            <Text variant="heading">{`${driver.vehicle.model} ${driver.vehicle.color}`}</Text>
            <Text variant="bodyMedium" tone="secondary">{`Placa ${driver.vehicle.plate}`}</Text>
          </View>
        </Block>

        <View style={styles.stats}>
          <View style={[styles.stat, { backgroundColor: colors.cards[0] }]} accessible accessibilityLabel={`Viagens concluídas em ${month}: ${spent.trips}`}>
            <Label tone="onCardMuted">{`Viagens em ${month}`}</Label>
            <Text variant="displaySm" tone="onCard">
              {String(spent.trips)}
            </Text>
          </View>
          <View style={[styles.stat, styles.statWide, { backgroundColor: colors.cards[1] }]} accessible accessibilityLabel={`Gasto em ${month}: ${formatPrice(spent.totalCents)}`}>
            <Label tone="onCardMuted">{`Gasto em ${month}`}</Label>
            <Text variant="displaySm" tone="onCard" numberOfLines={1}>
              {formatPriceShort(spent.totalCents)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Label>Seus horários</Label>
          {slots.length > 0 ? (
            slots.map((slot) => (
              <Block key={slot.key} style={styles.slot}>
                <View style={styles.slotHead}>
                  <Text variant="title">{slot.time}</Text>
                  <Text variant="small" tone="secondary">
                    {weekdaysLabel(slot.weekdays)}
                  </Text>
                </View>
                <Text variant="small" tone="secondary" numberOfLines={2}>
                  {`${slot.origin} → ${slot.destination}`}
                </Text>
                {slot.waiting > 0 ? (
                  <View style={styles.waiting}>
                    <Icon name="hourglass_top" size={size.icon.sm} color={colors.textSecondary} />
                    <Text variant="small" tone="secondary">
                      {slot.waiting === 1 ? '1 viagem esperando aprovação' : `${slot.waiting} viagens esperando aprovação`}
                    </Text>
                  </View>
                ) : null}
              </Block>
            ))
          ) : (
            <Text variant="small" tone="secondary">
              {`Nenhuma viagem marcada com ${first}. Peça as viagens da sua semana.`}
            </Text>
          )}
        </View>

        {renewing.length > 0 ? (
          <View style={styles.section}>
            <Label>Pedidos que renovam todo mês</Label>
            {renewing.map((routine) => (
              <Block key={routine.id} style={styles.slot}>
                <Text variant="bodyMedium">
                  {`${weekdaysLabel([...new Set(routine.trips.map((t) => t.weekday))])} · ${routine.trips.length === 1 ? '1 viagem' : `${routine.trips.length} viagens`} por semana`}
                </Text>
                <Text variant="small" tone="secondary">
                  {routine.stoppedAt ? 'Parado. As viagens já aprovadas continuam; não renova mais.' : 'Renova no começo de cada mês e vai para a aprovação.'}
                </Text>
                <Button
                  label={routine.stoppedAt ? 'Voltar a renovar' : 'Parar de renovar'}
                  icon={routine.stoppedAt ? 'autorenew' : 'block'}
                  size="sm"
                  variant="ghost"
                  destructive={!routine.stoppedAt}
                  onPress={() => stopRoutine(routine.id, routine.stoppedAt ? null : new Date())}
                  style={styles.alignStart}
                />
              </Block>
            ))}
          </View>
        ) : null}

        <Button label={`Pedir viagens com ${first}`} icon="add" variant="light" onPress={() => router.push('/request')} />
      </ScrollView>

      <TripOptions
        visible={options}
        title={driver.name}
        onClose={() => setOptions(false)}
        options={[
          { key: 'call', label: `Ligar para ${first} · ${formatPhone(driver.phone)}`, icon: 'call', onPress: () => Linking.openURL(`tel:${driver.phone}`) },
          { key: 'leave', label: 'Sair da rede', icon: 'person_remove', destructive: true, onPress: () => setLeaving(true) },
        ]}
      />
      <ConfirmDialog
        visible={leaving}
        title={`Sair da rede de ${first}?`}
        text={`As viagens com ${first} de hoje em diante saem da sua agenda, e ${first} recebe um aviso. Para voltar, você vai precisar de um novo convite.`}
        confirmLabel="Sair da rede"
        confirmIcon="person_remove"
        destructive
        onConfirm={() => {
          leaveDriver(driver.id);
          setLeaving(false);
          setJustLeft(driver.id);
        }}
        onClose={() => setLeaving(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  content: { paddingHorizontal: layout.screenPadding, paddingTop: spacing[8], paddingBottom: layout.scrollEnd, gap: spacing[20] },
  head: { paddingHorizontal: spacing[4], paddingTop: spacing[28] },
  lead: { marginTop: spacing[12] },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[12], paddingHorizontal: spacing[4], paddingTop: spacing[20] },
  headText: { flex: 1, gap: spacing[4] },
  car: { flexDirection: 'row', alignItems: 'center', gap: spacing[16] },
  carText: { flex: 1, gap: spacing[2] },
  stats: { flexDirection: 'row', gap: spacing[8] },
  stat: { flex: 1, minHeight: size.statCardMinHeight, borderRadius: radius.card, padding: spacing[20], justifyContent: 'space-between' },
  statWide: { flex: layout.statWideFlex },
  section: { gap: spacing[8] },
  slot: { gap: spacing[6] },
  slotHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing[12] },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: spacing[6] },
  alignStart: { alignSelf: 'flex-start' },
});
