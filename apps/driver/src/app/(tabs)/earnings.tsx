import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Block, Button, colors, focusRing, Icon, layout, Pills, radius, ScreenStatus, size, spacing, stateOpacity, Text, useInteraction } from '@trustcab/ui';
import { ChargeSheet, type ChargeLine } from '@/components/ChargeSheet';
import { TopBar } from '@/components/TopBar';
import { formatPrice, formatPriceShort, isSameDay, monthName, type Day, type Trip, useNow, weekdayShort } from '@trustcab/core';
import { clearChargeSent, setChargeSent, setTripPaidAt, useCharges } from '@trustcab/core/db';
import { tripBase, useDays } from '@/data/days';
import { useDriver } from '@/data/driver';
import { sendTo } from '@/data/whatsapp';
import { useProfile } from '@/data/profile';

// Quantos meses para trás a tela deixa navegar.
const MONTHS = 6;

const ALL = 'todos';

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

// Timestamp do Firestore vira Date. Enquanto a escrita não volta do servidor o campo vem null:
// aí "agora" é a melhor aproximação, porque é o que a pessoa acabou de fazer.
function toDate(value: unknown): Date | undefined {
  if (value == null) return undefined;
  const stamp = value as { toDate?: () => Date };
  return stamp.toDate ? stamp.toDate() : new Date();
}

function sum(trips: Trip[]) {
  return trips.reduce((total, trip) => total + trip.priceCents, 0);
}

function countLabel(count: number) {
  return count === 1 ? '1 viagem' : `${count} viagens`;
}

// Ganhos: total do mês, quanto cada passageiro gastou e a quebra por dia e por viagem.
// Só entram viagens concluídas: agendadas, a caminho e canceladas ficam fora de todos os totais.
export default function Earnings() {
  const params = useLocalSearchParams<{ passenger?: string; month?: string }>();
  const now = useNow();
  const { uid } = useDriver();
  const { pix } = useProfile();
  const pixKey = pix?.key ?? null;

  // Seis meses de uma vez: a faixa de meses troca sem nova consulta, e a conta do mês precisa
  // das viagens do mês inteiro de qualquer jeito.
  const from = useMemo(() => new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1), 1), [now]);
  const to = useMemo(() => new Date(now.getFullYear(), now.getMonth() + 1, 0), [now]);
  const { days: allDays, agendas, paid, loading, error } = useDays(uid, from, to);
  const charges = useCharges(uid);

  const [month, setMonth] = useState(() => monthKey(now));
  const [passenger, setPassenger] = useState(ALL);
  const [preview, setPreview] = useState(false);

  // Os dias agrupados por mês, do mais antigo para o mais novo — o mesmo formato que a tela
  // sempre usou, agora vindo do banco.
  const history = useMemo(() => {
    const meses: { month: Date; days: Day[] }[] = [];
    for (let i = MONTHS - 1; i >= 0; i -= 1) {
      const mes = new Date(now.getFullYear(), now.getMonth() - i, 1);
      meses.push({
        month: mes,
        days: allDays.filter((day) => day.date.getFullYear() === mes.getFullYear() && day.date.getMonth() === mes.getMonth()),
      });
    }
    return meses;
  }, [allDays, now]);

  // Quem chega pelo "Ver gastos" de uma viagem já vê o passageiro e o mês daquela viagem.
  useEffect(() => {
    if (params.passenger) setPassenger(params.passenger);
    // Mês que ainda não chegou não tem ganhos: fica no mês atual.
    if (params.month && history.some((entry) => monthKey(entry.month) === params.month)) setMonth(params.month);
  }, [params.passenger, params.month, history]);

  const current = history.find((entry) => monthKey(entry.month) === month) ?? history[history.length - 1];
  const days = current.days;

  // Agrupar por pessoa, não por nome: dois passageiros chamados igual são duas pessoas, com
  // duas contas e dois WhatsApps. O nome serve de rótulo.
  const people = [...new Map(days.flatMap((day) => day.trips).map((trip) => [trip.passengerId, trip.passenger])).entries()].map(
    ([id, nome]) => ({ id, nome }),
  );
  const selected = people.find((person) => person.id === passenger) ?? null;
  const matches = (trip: Trip) => passenger === ALL || trip.passengerId === passenger;

  const doneDays = days
    .map((day) => ({ date: day.date, trips: day.trips.filter((trip) => trip.status === 'completed' && matches(trip)) }))
    .filter((day) => day.trips.length > 0)
    .reverse();
  const done = doneDays.flatMap((day) => day.trips);

  const total = sum(done);
  const name = monthName(current.month);
  const fullName = selected?.nome ?? '';
  const firstName = fullName.split(' ')[0] ?? '';
  // A cobrança sai pelo WhatsApp: sem o número do passageiro não há para onde mandar. O nome é a
  // chave porque é por ele que a tela inteira agrupa; dois passageiros com o mesmo nome cairiam no
  // mesmo balde, e aí o motorista corrige um dos dois no cadastro.
  const phoneOf = (id: string) => agendas.find((a) => a.passengerId === id)?.passengerPhone ?? null;

  const byPassenger = people.map((person, index) => {
    const trips = days.flatMap((day) => day.trips).filter((trip) => trip.status === 'completed' && trip.passengerId === person.id);
    return { ...person, trips, total: sum(trips), color: colors.cards[index % colors.cards.length] };
  });

  // Viagem paga na hora (QR Code) não entra na cobrança do mês.
  const chargeLines: ChargeLine[] = [...doneDays]
    .reverse()
    .flatMap((day) => day.trips.filter((trip) => !paid.has(trip.id)).map((trip) => ({ date: day.date, trip })));
  const chargeTotal = sum(chargeLines.map((line) => line.trip));
  const paidCount = done.filter((trip) => paid.has(trip.id)).length;

  // O mês da cobrança em AAAA-MM, que é como ele fica guardado.
  const chargeMonth = `${current.month.getFullYear()}-${String(current.month.getMonth() + 1).padStart(2, '0')}`;
  const passengerId = passenger === ALL ? null : passenger;
  const charge = passengerId
    ? charges.data.find((c) => c.passengerId === passengerId && c.month === chargeMonth)
    : undefined;
  const sentAt = toDate(charge?.sentAt);
  const key = passengerId;

  // Mês mais recente primeiro, para o mês atual aparecer sem rolar.
  const monthItems = [...history].reverse().map((entry) => ({
    key: monthKey(entry.month),
    label:
      entry.month.getFullYear() === now.getFullYear()
        ? monthName(entry.month).slice(0, 3)
        : `${monthName(entry.month).slice(0, 3)} ${String(entry.month.getFullYear()).slice(2)}`,
    accessibilityLabel: `${monthName(entry.month)} de ${entry.month.getFullYear()}`,
  }));
  const passengerItems = [
    { key: ALL, label: 'Todos', accessibilityLabel: 'Todos os passageiros' },
    ...people.map((person) => ({ key: person.id, label: person.nome.split(' ')[0], accessibilityLabel: person.nome })),
  ];

  if (loading || error) {
    return <ScreenStatus state={error ? 'error' : 'loading'} layout="list" onRetry={() => router.replace('/earnings')} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TopBar title="Ganhos" />

        <Pills items={monthItems} selected={monthKey(current.month)} onSelect={setMonth} accessibilityLabel="Mês" />

        <View style={styles.title}>
          <Text variant="display">{formatPriceShort(total)}</Text>
          <Text variant="display" tone="secondary">
            {passenger === ALL ? `em ${name}` : `de ${firstName}`}
          </Text>
          <Text variant="bodyMedium" tone="secondary" style={styles.subtitle}>
            {done.length > 0 ? `${countLabel(done.length)} concluídas` : 'Nenhuma viagem concluída'}
          </Text>
        </View>

        <Pills items={passengerItems} selected={passenger} onSelect={setPassenger} accessibilityLabel="Passageiro" />

        {passenger === ALL && byPassenger.length > 0 ? (
          <View style={styles.people}>
            {byPassenger.map(({ id, nome, trips, total: personTotal, color }, index) => (
              <PersonCard
                key={id}
                person={nome}
                count={trips.length}
                totalCents={personTotal}
                color={color}
                first={index === 0}
                last={index === byPassenger.length - 1}
                onPress={() => setPassenger(id)}
              />
            ))}
          </View>
        ) : null}

        {doneDays.length > 0 ? (
          <View style={styles.days}>
            {doneDays.map(({ date, trips }) => (
              <Block key={date.toISOString()} style={styles.day}>
                <View style={styles.dayHead}>
                  <Text variant="bodyMedium">{`${weekdayShort(date)}, ${date.getDate()}`}</Text>
                  <Text variant="bodyMedium">{formatPrice(sum(trips))}</Text>
                </View>
                {trips.map((trip) => (
                  <View key={trip.id} style={styles.tripRow}>
                    <Text variant="small" tone="secondary" style={styles.tripTime}>
                      {trip.time}
                    </Text>
                    <Text variant="small" tone="secondary" style={styles.tripWho} numberOfLines={1}>
                      {passenger === ALL ? trip.passenger : `${trip.origin} → ${trip.destination}`}
                    </Text>
                    {/* Pago: o valor fica riscado com um visto do lado. O risco diz "não conta mais"
                        e o ícone repete a informação, para o estado não depender só do traço. */}
                    <View style={styles.tripPrice}>
                      <Text
                        variant="small"
                        tone="secondary"
                        style={paid.has(trip.id) ? styles.priceSettled : undefined}
                        accessibilityLabel={paid.has(trip.id) ? `${formatPrice(trip.priceCents)}, pago` : undefined}>
                        {formatPrice(trip.priceCents)}
                      </Text>
                      {paid.has(trip.id) ? <Icon name="check" size={size.icon.sm} color={colors.textSecondary} /> : null}
                    </View>
                  </View>
                ))}
              </Block>
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Text variant="heading" tone="secondary">
              {passenger === ALL ? `Nenhuma viagem concluída em ${name}.` : `${firstName} não tem viagens concluídas em ${name}.`}
            </Text>
            <Text variant="small" tone="secondary">
              As viagens entram aqui quando você toca em "Concluir viagem".
            </Text>
          </View>
        )}

        {passenger !== ALL && done.length > 0 && key ? (
          <View style={styles.charge}>
            {sentAt ? (
              <Block style={styles.sent}>
                <Text variant="bodyMedium">{`Cobrança de ${name} enviada para ${firstName}`}</Text>
                <Text variant="small" tone="secondary">
                  {`Enviada em ${sentAt.getDate()}/${sentAt.getMonth() + 1}, às ${String(sentAt.getHours()).padStart(2, '0')}:${String(
                    sentAt.getMinutes(),
                  ).padStart(2, '0')}.`}
                </Text>
                {/* Fechar o mês de uma vez: o padrão é o passageiro ter pago tudo, e marcar
                    viagem por viagem num mês de 30 corridas não é trabalho de ninguém. A exceção
                    continua possível — desmarcar uma viagem depois, na folha dela. */}
                <Button
                  label={`Confirmar pagamento · ${formatPrice(chargeTotal)}`}
                  icon="paid"
                  variant="light"
                  onPress={() =>
                    chargeLines.forEach(({ trip }) => {
                      const base = tripBase(agendas, trip);
                      if (base) void setTripPaidAt(base, true).catch(() => undefined);
                    })
                  }
                  accessibilityHint={`Marca as ${chargeLines.length} viagens de ${name} como pagas de uma vez`}
                />
                <View style={styles.sentActions}>
                  <Button
                    label="Abrir o WhatsApp"
                    icon="chat"
                    size="sm"
                    variant="surface"
                    onPress={() => sendTo(phoneOf(passenger), '')}
                  />
                  <Button
                    label="Marcar como não enviada"
                    icon="undo"
                    size="sm"
                    variant="ghost"
                    destructive
                    onPress={() => uid && void clearChargeSent(uid, key, chargeMonth).catch(() => undefined)}
                  />
                </View>
              </Block>
            ) : chargeLines.length === 0 ? (
              <Block style={styles.sent}>
                <Text variant="bodyMedium">{`${firstName} já pagou todas as viagens de ${name}`}</Text>
                <Text variant="small" tone="secondary">
                  Cada viagem foi marcada como paga na hora. Não há o que cobrar neste mês.
                </Text>
              </Block>
            ) : (
              <>
                <Button label="Gerar cobrança" icon="request_quote" variant="light" onPress={() => setPreview(true)} />
                <Text variant="small" tone="secondary" style={styles.chargeHint}>
                  {paidCount > 0
                    ? `Abre o WhatsApp de ${firstName} com as viagens de ${name} ainda não pagas, com data, horário e valor, o total e sua chave Pix.`
                    : `Abre o WhatsApp de ${firstName} com as viagens de ${name}, com data, horário e valor, o total e sua chave Pix.`}
                </Text>
              </>
            )}
          </View>
        ) : null}
      </ScrollView>

      {key ? (
        <ChargeSheet
          visible={preview}
          passenger={fullName}
          monthLabel={name}
          lines={chargeLines}
          totalCents={chargeTotal}
          pixKey={pixKey}
          paidCount={paidCount}
          onClose={() => setPreview(false)}
          onAddPix={() => {
            setPreview(false);
            router.push('/pix');
          }}
          onSend={() => {
            // O texto é o mesmo que a prévia mostra: o WhatsApp abre com ele escrito e o
            // motorista toca em enviar. Marcar como enviada é dele — nós não temos como saber.
            const lines = chargeLines.map(({ date, trip }) => `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} · ${trip.time} — ${formatPrice(trip.priceCents)}`);
            void sendTo(
              phoneOf(passenger),
              [`Olá, ${firstName}! Estas são as suas viagens de ${name}:`, ...lines, `Total: ${formatPrice(chargeTotal)}`, `Pix: ${pixKey}`].join('\n'),
            );
            if (uid) {
              void setChargeSent({
                driverId: uid,
                passengerId: key,
                month: chargeMonth,
                totalCents: chargeTotal,
                trips: chargeLines.length,
              }).catch(() => undefined);
            }
            setPreview(false);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

// Cartão colorido com o total de um passageiro no mês. Tocar filtra a tela por ele.
function PersonCard({
  person,
  count,
  totalCents,
  color,
  first,
  last,
  onPress,
}: {
  person: string;
  count: number;
  totalCents: number;
  color: string;
  first: boolean;
  last: boolean;
  onPress: () => void;
}) {
  const { hovered, focused, handlers } = useInteraction();
  return (
    <Pressable
      {...handlers}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${person}: ${formatPrice(totalCents)} em ${countLabel(count)}. Ver só as viagens de ${person.split(' ')[0]}`}
      style={({ pressed }) => [
        styles.person,
        { backgroundColor: color, opacity: stateOpacity({ pressed, hovered, disabled: false }) },
        first && styles.personFirst,
        last && styles.personLast,
        focused && focusRing(),
      ]}>
      <View style={styles.personText}>
        <Text variant="heading" tone="onCard" numberOfLines={1}>
          {person}
        </Text>
        <Text variant="small" tone="onCardMuted">
          {countLabel(count)}
        </Text>
      </View>
      <Text variant="title" tone="onCard">
        {formatPriceShort(totalCents)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[8],
    paddingBottom: layout.scrollEnd,
    gap: spacing[20],
  },
  title: { paddingHorizontal: spacing[4] },
  subtitle: { marginTop: spacing[8] },
  people: { gap: spacing[4] },
  person: {
    minHeight: size.personCardMinHeight,
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[16],
    borderRadius: radius.joined,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
  },
  personFirst: { borderTopLeftRadius: radius.block, borderTopRightRadius: radius.block },
  personLast: { borderBottomLeftRadius: radius.block, borderBottomRightRadius: radius.block },
  personText: { flex: 1, gap: spacing[4] },
  days: { gap: layout.gap },
  day: { gap: spacing[8], paddingVertical: spacing[16] },
  dayHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[4] },
  tripRow: { flexDirection: 'row', gap: spacing[12] },
  tripTime: { width: size.timeColumn, fontVariant: ['tabular-nums'] },
  tripWho: { flex: 1 },
  tripPrice: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  priceSettled: { textDecorationLine: 'line-through' },
  empty: { paddingTop: spacing[20], paddingHorizontal: spacing[4], gap: spacing[8] },
  charge: { gap: spacing[12], marginTop: spacing[8] },
  chargeHint: { paddingHorizontal: spacing[4], textAlign: 'center' },
  sent: { gap: spacing[4] },
  sentActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8], marginTop: spacing[8] },
});
