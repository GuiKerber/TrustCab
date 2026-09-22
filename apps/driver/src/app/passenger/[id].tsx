import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Block, borderWidth, Button, colors, focusRing, Icon, IconButton, Label, layout, radius, size, spacing, stateOpacity, Text, TripOptions, useInteraction } from '@trustcab/ui';
import {
  passengerMonths,
  setPassengerStatus,
  setRequestDecision,
  usePassengerStore,
  withState,
  type MonthSpend,
  type PassengerState,
  type PassengerWithState,
  type RequestDecision,
} from '@/data/passengers';
import { formatPhone, formatPrice, formatPriceShort, driver, longDate, monthName, relativeDay, sampleHistory, samplePassengers, sampleTripRequests, type TripRequest } from '@trustcab/core';
import { inviteMessage, useProfile } from '@/data/profile';
import { useTripSignals } from '@/data/tripSignals';

const capitalize = (text: string) => `${text[0].toUpperCase()}${text.slice(1)}`;

// Página do passageiro. Muda conforme o estado:
// ativo (viagens para aprovar, totais, gastos por mês e cobrança) e convite (reenviar ou cancelar).
// Toda ação pode ser desfeita.
export default function PassengerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const now = useMemo(() => new Date(), []);
  const base = useMemo(() => samplePassengers(now), [now]);
  const history = useMemo(() => sampleHistory(now), [now]);
  const requests = useMemo(() => sampleTripRequests(now), [now]);
  const store = usePassengerStore();
  const signals = useTripSignals();
  const [options, setOptions] = useState(false);
  // Estado anterior à última ação, para o "Desfazer".
  const [undo, setUndo] = useState<PassengerState | null>(null);

  const passenger = withState(base, store).find((p) => p.id === id);

  if (!passenger) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.content}>
          <IconButton name="arrow_back" label="Voltar" onPress={() => router.back()} />
          <Text variant="heading" tone="secondary">
            Não encontramos este passageiro.
          </Text>
          <Text variant="small" tone="secondary">
            Volte para a lista e tente de novo.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const firstName = passenger.name.split(' ')[0];
  const act = (next: PassengerState) => {
    setUndo(passenger.state);
    setPassengerStatus(passenger.id, next);
  };
  const revert = () => {
    if (undo) setPassengerStatus(passenger.id, undo);
    setUndo(null);
  };

  const status = STATUS[passenger.state];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <IconButton name="arrow_back" label="Voltar" onPress={() => router.back()} />
          <View style={styles.topActions}>
            {passenger.state === 'active' ? (
              <IconButton name="chat" label={`Conversar com ${firstName}`} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: passenger.id } })} />
            ) : null}
            <IconButton name="more_horiz" label="Mais opções" onPress={() => setOptions(true)} />
          </View>
        </View>

        <View style={styles.head}>
          <Label>{status.label}</Label>
          <Text variant="display">{passenger.name}</Text>
          <Text variant="small" tone="secondary">
            {`${status.since} ${passenger.state === 'invited' || passenger.state === 'cancelled' ? relativeDay(passenger.since, now).toLowerCase() : longDate(passenger.since)}`}
          </Text>
        </View>

        {undo ? <Notice text={status.done(firstName)} onUndo={revert} /> : null}

        {passenger.state === 'active' ? (
          <Active
            passenger={passenger}
            months={passengerMonths(passenger.name, history, signals)}
            requests={requests.filter((request) => request.passengerId === passenger.id)}
            decisions={store.decisions}
            now={now}
          />
        ) : null}
        {passenger.state === 'invited' ? <Invited passenger={passenger} firstName={firstName} onCancel={() => act('cancelled')} /> : null}
        {RESTORE[passenger.state] && !undo ? (
          <Button label={RESTORE[passenger.state]!.label} icon="undo" variant="light" onPress={() => act(RESTORE[passenger.state]!.to)} />
        ) : null}
      </ScrollView>

      <TripOptions
        visible={options}
        title={passenger.name}
        onClose={() => setOptions(false)}
        options={[
          { key: 'call', label: `Ligar para ${firstName}`, icon: 'call', onPress: () => Linking.openURL(`tel:${passenger.phone}`) },
          ...(passenger.state === 'active'
            ? [{ key: 'end', label: 'Encerrar conexão', icon: 'person_remove' as const, destructive: true, onPress: () => act('ended') }]
            : []),
        ]}
      />
    </SafeAreaView>
  );
}

const STATUS: Record<PassengerState, { label: string; since: string; done: (name: string) => string }> = {
  active: { label: 'Ativo', since: 'Na sua rede desde', done: (name) => `${name} voltou para a sua rede e pode pedir viagens.` },
  invited: { label: 'Convite enviado', since: 'Convidado', done: (name) => `O convite de ${name} voltou para os pendentes.` },
  cancelled: { label: 'Convite cancelado', since: 'Convidado', done: (name) => `Você cancelou o convite de ${name}. O link deixa de valer para ela.` },
  ended: { label: 'Conexão encerrada', since: 'Na sua rede desde', done: (name) => `Você encerrou a conexão com ${name}. As viagens de hoje em diante saíram da sua agenda; o histórico continua aqui.` },
};

// Quem saiu das listas sempre pode voltar, mesmo depois de fechar a página.
const RESTORE: Partial<Record<PassengerState, { label: string; to: PassengerState }>> = {
  cancelled: { label: 'Voltar para os pendentes', to: 'invited' },
  ended: { label: 'Reativar conexão', to: 'active' },
};

// Confirmação da última ação, sempre com "Desfazer".
function Notice({ text, onUndo }: { text: string; onUndo: () => void }) {
  return (
    <Block style={styles.notice}>
      <Text variant="small" style={styles.noticeText} accessibilityLiveRegion="polite">
        {text}
      </Text>
      <Button label="Desfazer" icon="undo" size="sm" variant="ghost" onPress={onUndo} />
    </Block>
  );
}

function Active({
  passenger,
  months,
  requests,
  decisions,
  now,
}: {
  passenger: PassengerWithState;
  months: MonthSpend[];
  requests: TripRequest[];
  decisions: Record<string, RequestDecision>;
  now: Date;
}) {
  const since = new Date(passenger.since.getFullYear(), passenger.since.getMonth(), 1);
  const visible = months.filter((m) => m.month >= since).reverse();
  const trips = visible.reduce((sum, m) => sum + m.trips, 0);
  const total = visible.reduce((sum, m) => sum + m.totalCents, 0);
  const minutes = visible.reduce((sum, m) => sum + m.minutes, 0);
  const current = visible[0];
  const currentName = monthName(now);

  const openMonth = (month: Date) =>
    router.navigate({ pathname: '/earnings', params: { passenger: passenger.name, month: `${month.getFullYear()}-${month.getMonth()}` } });

  return (
    <>
      {requests.length > 0 ? <TripRequests requests={requests} decisions={decisions} now={now} /> : null}

      <View style={styles.stats}>
        <StatCard
          color={colors.cards[0]}
          title="Viagens concluídas"
          value={String(trips)}
          detailLabel="Duração média"
          detail={trips > 0 ? `${Math.round(minutes / trips)} min` : '—'}
        />
        <StatCard
          color={colors.cards[1]}
          title="Custo total"
          value={formatPriceShort(total)}
          detailLabel="Ticket médio"
          detail={trips > 0 ? formatPrice(Math.round(total / trips)) : '—'}
          wide
        />
      </View>

      <View style={styles.section}>
        <Label>Gastos por mês</Label>
        {visible.some((m) => m.trips > 0) ? (
          <View style={styles.table}>
            {visible.map((m, index) => (
              <MonthRow
                key={m.month.toISOString()}
                spend={m}
                current={index === 0}
                first={index === 0}
                last={index === visible.length - 1}
                onPress={() => openMonth(m.month)}
              />
            ))}
          </View>
        ) : (
          <Text variant="small" tone="secondary">
            Nenhuma viagem concluída ainda. Elas aparecem aqui quando você toca em "Concluir viagem".
          </Text>
        )}
      </View>

      {current && current.trips > 0 ? (
        <Button
          label={`Gerar cobrança de ${currentName}`}
          icon="request_quote"
          variant="light"
          onPress={() => openMonth(current.month)}
          accessibilityHint="Abre Ganhos com as viagens do mês para enviar a cobrança no chat"
        />
      ) : null}
    </>
  );
}

// Cartão de total. Mesma tipografia em todas as cores: título no topo, respiro, número principal e o secundário embaixo.
function StatCard({
  color,
  title,
  value,
  detailLabel,
  detail,
  wide = false,
}: {
  color: string;
  title: string;
  value: string;
  detailLabel: string;
  detail: string;
  wide?: boolean;
}) {
  return (
    <View style={[styles.stat, wide && styles.statWide, { backgroundColor: color }]} accessible accessibilityLabel={`${title}: ${value}. ${detailLabel}: ${detail}`}>
      <Label tone="onCardMuted">{title}</Label>
      <View style={styles.statBottom}>
        <Text variant="displaySm" tone="onCard" numberOfLines={1}>
          {value}
        </Text>
        <View style={[styles.statDetail, { borderTopColor: colors.inkLine }]}>
          <Text variant="small" tone="onCardMuted">
            {detailLabel}
          </Text>
          <Text variant="bodyMedium" tone="onCard">
            {detail}
          </Text>
        </View>
      </View>
    </View>
  );
}

function MonthRow({ spend, current, first, last, onPress }: { spend: MonthSpend; current: boolean; first: boolean; last: boolean; onPress: () => void }) {
  const { hovered, focused, handlers } = useInteraction();
  const name = capitalize(monthName(spend.month));
  return (
    <Pressable
      {...handlers}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}: ${spend.trips} viagens, ${formatPrice(spend.totalCents)}. Abrir em Ganhos`}
      style={({ pressed }) => [
        styles.row,
        first && styles.rowFirst,
        last && styles.rowLast,
        { opacity: stateOpacity({ pressed, hovered, disabled: false }) },
        focused && focusRing(),
      ]}>
      <View style={styles.rowMonth}>
        <Text variant="bodyMedium">{name}</Text>
        {current ? (
          <Text variant="small" tone="secondary">
            até hoje
          </Text>
        ) : null}
      </View>
      <Text variant="small" tone="secondary" style={styles.rowTrips}>
        {spend.trips === 1 ? '1 viagem' : `${spend.trips} viagens`}
      </Text>
      <Text variant="bodyMedium" style={styles.rowTotal}>
        {formatPrice(spend.totalCents)}
      </Text>
      <Icon name="chevron_right" size={size.icon.md} color={colors.textSecondary} />
    </Pressable>
  );
}

// Viagens pedidas pelo passageiro. Cada uma é aprovada ou recusada sozinha: você pode não ter o horário livre em todos os dias.
// Depois de decidir, o pedido continua na lista com "Desfazer".
function TripRequests({ requests, decisions, now }: { requests: TripRequest[]; decisions: Record<string, RequestDecision>; now: Date }) {
  const waiting = requests.filter((request) => !decisions[request.id]).length;
  return (
    <View style={styles.section}>
      <Label>{waiting > 0 ? `Viagens para aprovar · ${waiting}` : 'Viagens pedidas'}</Label>
      <View style={styles.requests}>
        {requests.map((request) => {
          const decision = decisions[request.id];
          return (
            <Block key={request.id} style={styles.request}>
              <View style={styles.requestHead}>
                <View style={styles.requestWhen}>
                  <Text variant="small" tone="secondary">
                    {relativeDay(request.date, now)}
                  </Text>
                  <Text variant="title">{request.time}</Text>
                </View>
                <View style={styles.requestPrice}>
                  <Text variant="small" tone="secondary">
                    Valor proposto
                  </Text>
                  <Text variant="bodyMedium">{formatPrice(request.priceCents)}</Text>
                </View>
              </View>
              <Text variant="small" tone="secondary" numberOfLines={2}>
                {`${request.origin} → ${request.destination}`}
              </Text>
              {decision ? (
                <View style={styles.requestDone} accessibilityLiveRegion="polite">
                  <Icon name={decision === 'approved' ? 'check_circle' : 'cancel'} size={size.icon.md} color={decision === 'approved' ? colors.text : colors.orange} />
                  <Text variant="bodyMedium" tone={decision === 'approved' ? 'text' : 'orange'} style={styles.requestDoneText}>
                    {decision === 'approved' ? 'Aprovada. Já está na sua agenda.' : 'Recusada.'}
                  </Text>
                  <Button label="Desfazer" icon="undo" size="sm" variant="ghost" onPress={() => setRequestDecision(request.id, null)} />
                </View>
              ) : (
                <View style={styles.requestActions}>
                  <Button label="Aprovar" icon="check" variant="light" style={styles.requestApprove} onPress={() => setRequestDecision(request.id, 'approved')} />
                  <Button label="Recusar" size="sm" variant="ghost" destructive onPress={() => setRequestDecision(request.id, 'declined')} />
                </View>
              )}
            </Block>
          );
        })}
      </View>
    </View>
  );
}

function Invited({ passenger, firstName, onCancel }: { passenger: PassengerWithState; firstName: string; onCancel: () => void }) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { inviteToken } = useProfile();
  const message = inviteMessage(firstName, driver.firstName, inviteToken);

  const resend = async () => {
    setSending(true);
    setError(null);
    try {
      await Linking.openURL(`https://wa.me/55${passenger.phone}?text=${encodeURIComponent(message)}`);
    } catch {
      setError('Não deu para abrir o WhatsApp. Confira se ele está instalado e tente de novo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Block style={styles.info}>
        <Label>WhatsApp</Label>
        <Text variant="heading">{formatPhone(passenger.phone)}</Text>
        <Text variant="small" tone="secondary">
          {`${firstName} ainda não entrou pelo seu link.`}
        </Text>
      </Block>
      {error ? (
        <Text variant="small" tone="orange" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Button label="Reenviar pelo WhatsApp" icon="send" variant="light" loading={sending} onPress={resend} />
        <Button label="Cancelar convite" size="sm" variant="ghost" destructive onPress={onCancel} style={styles.center} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  requestPrice: { alignItems: 'flex-end', gap: spacing[2] },
  safe: { flex: 1, backgroundColor: colors.ground },
  content: { paddingHorizontal: layout.screenPadding, paddingTop: spacing[8], paddingBottom: spacing[40], gap: spacing[20] },
  topBar: { flexDirection: 'row', justifyContent: 'space-between' },
  topActions: { flexDirection: 'row', gap: spacing[8] },
  head: { gap: spacing[4], paddingHorizontal: spacing[4], paddingTop: spacing[20] },
  notice: { flexDirection: 'row', alignItems: 'center', gap: spacing[8], paddingVertical: spacing[8], paddingRight: spacing[8] },
  noticeText: { flex: 1 },
  stats: { flexDirection: 'row', gap: layout.gap },
  // Custos ganham mais largura: o valor tem mais dígitos que o número de viagens.
  statWide: { flex: layout.statWideFlex },
  stat: {
    flex: 1,
    minHeight: size.statCardMinHeight,
    borderRadius: radius.block,
    padding: spacing[16],
    justifyContent: 'space-between',
    gap: spacing[28],
  },
  statBottom: { gap: spacing[12] },
  statDetail: {
    borderTopWidth: borderWidth.hairline,
    paddingTop: spacing[8],
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  section: { gap: spacing[12] },
  table: { gap: spacing[2] },
  row: {
    minHeight: size.button.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    backgroundColor: colors.surface,
    borderRadius: radius.joined,
  },
  rowFirst: { borderTopLeftRadius: radius.block, borderTopRightRadius: radius.block },
  rowLast: { borderBottomLeftRadius: radius.block, borderBottomRightRadius: radius.block },
  rowMonth: { flex: 1 },
  rowTrips: { fontVariant: ['tabular-nums'] },
  rowTotal: { fontVariant: ['tabular-nums'] },
  requests: { gap: layout.gap },
  request: { gap: spacing[8], padding: spacing[16] },
  requestHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing[12] },
  requestWhen: { gap: spacing[2] },
  requestActions: { flexDirection: 'row', alignItems: 'center', gap: spacing[8], marginTop: spacing[4] },
  requestApprove: { flex: 1 },
  requestDone: { flexDirection: 'row', alignItems: 'center', gap: spacing[8], marginTop: spacing[4] },
  requestDoneText: { flex: 1 },
  info: { gap: spacing[4], borderWidth: borderWidth.hairline, borderColor: colors.line },
  actions: { gap: spacing[8], marginTop: spacing[8] },
  center: { alignSelf: 'center' },
});
