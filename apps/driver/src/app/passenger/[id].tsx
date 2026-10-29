import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Block,
  borderWidth,
  Button,
  colors,
  ConfirmDialog,
  focusRing,
  Icon,
  IconButton,
  Label,
  Pills,
  layout,
  radius,
  ScreenStatus,
  size,
  spacing,
  stateOpacity,
  Text,
  TripOptions,
  useInteraction,
} from '@trustcab/ui';
import {
  formatPhone,
  formatPrice,
  formatPriceShort,
  longDate,
  monthName,
  reportText,
  reportUrl,
  routeLabel,
  useNow,
  whenLabel,
} from '@trustcab/core';
import { endAgenda, useAgendas, useRequests } from '@trustcab/core/db';
import { useDays } from '@/data/days';
import { useDriver } from '@/data/driver';
import { archivePassenger, restorePassenger, useNetwork } from '@/data/network';
import { sendTo } from '@/data/whatsapp';
import { goBack } from '@/lib/back';

const capitalize = (text: string) => `${text[0].toUpperCase()}${text.slice(1)}`;

// Quantos meses de histórico a página mostra.
const MONTHS = 6;

type Mes = { month: Date; trips: number; totalCents: number };

type Aba = 'combinado' | 'gastos';

// Ativo ou arquivado, com forma e ícone além da cor: quem não distingue cor precisa enxergar a
// diferença do mesmo jeito.
function StatusTag({ archived }: { archived: boolean }) {
  return (
    <View style={[styles.tag, archived ? styles.tagArchived : styles.tagActive]}>
      <Icon name={archived ? 'inventory_2' : 'check_circle'} size={size.icon.sm} color={archived ? colors.textSecondary : colors.ink} />
      <Text variant="label" style={{ color: archived ? colors.textSecondary : colors.ink }}>
        {archived ? 'Arquivado' : 'Ativo'}
      </Text>
    </View>
  );
}

// Página do passageiro: quem é, o que está combinado com ele, quanto ele gastou mês a mês e o
// atalho para a cobrança. Arquivar tira da lista sem apagar nada — a agenda e as viagens apontam
// para cá, e sem o nome o histórico fica ilegível.
export default function PassengerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const now = useNow();
  const { uid } = useDriver();
  const rede = useNetwork(uid);
  const agendas = useAgendas(uid);
  const requests = useRequests(uid);

  const from = useMemo(() => new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1), 1), [now]);
  const to = useMemo(() => new Date(now.getFullYear(), now.getMonth() + 1, 0), [now]);
  const { days, loading, error } = useDays(uid, from, to);

  const [options, setOptions] = useState(false);
  const [aba, setAba] = useState<Aba>('combinado');
  const [reporting, setReporting] = useState(false);
  const [ending, setEnding] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const passenger = rede.passengers.find((p) => p.id === id);

  if (rede.loading || loading || rede.error || error) {
    return (
      <ScreenStatus
        state={rede.error || error ? 'error' : 'loading'}
        layout="list"
        onRetry={() => router.replace({ pathname: '/passenger/[id]', params: { id: id ?? '' } })}
      />
    );
  }

  if (!passenger) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.content}>
          <IconButton name="arrow_back" label="Voltar" onPress={() => goBack('/passengers')} />
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
  const combinadas = agendas.data.filter((a) => a.passengerId === passenger.id && a.status === 'confirmed');
  const esperando = requests.data.filter((r) => r.passengerId === passenger.id);

  // Gastos mês a mês, só do que foi concluído — a mesma conta da tela de Ganhos.
  const meses: Mes[] = [];
  for (let i = 0; i < MONTHS; i += 1) {
    const mes = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const feitas = days
      .filter((day) => day.date.getFullYear() === mes.getFullYear() && day.date.getMonth() === mes.getMonth())
      .flatMap((day) => day.trips)
      .filter((trip) => trip.passengerId === passenger.id && trip.status === 'completed');
    meses.push({ month: mes, trips: feitas.length, totalCents: feitas.reduce((soma, t) => soma + t.priceCents, 0) });
  }

  const trips = meses.reduce((soma, m) => soma + m.trips, 0);
  const total = meses.reduce((soma, m) => soma + m.totalCents, 0);
  const current = meses[0];

  const openMonth = (month: Date) =>
    router.navigate({ pathname: '/earnings', params: { passenger: passenger.id, month: `${month.getFullYear()}-${month.getMonth()}` } });

  const arquivar = async () => {
    const arquivado = passenger.state === 'archived';
    try {
      await (arquivado ? restorePassenger(passenger.id) : archivePassenger(passenger.id));
      setAviso(arquivado ? `${firstName} voltou para a sua lista.` : `${firstName} foi para o arquivo.`);
    } catch {
      setAviso('Não deu para salvar. Confira sua internet e tente de novo.');
    }
  };

  const encerrar = async (agendaId: string) => {
    setEnding(null);
    try {
      await endAgenda(agendaId, 'driver');
      setAviso(`Combinado encerrado. Avise ${firstName} pelo WhatsApp.`);
    } catch {
      setAviso('Não deu para encerrar agora. Confira sua internet e tente de novo.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <IconButton name="arrow_back" label="Voltar" onPress={() => goBack('/passengers')} />
          <View style={styles.topActions}>
            <IconButton name="chat" label={`Conversar com ${firstName} no WhatsApp`} onPress={() => sendTo(passenger.phone, '')} />
            <IconButton name="more_horiz" label="Mais opções" onPress={() => setOptions(true)} />
          </View>
        </View>

        <View style={styles.head}>
          <StatusTag archived={passenger.state === 'archived'} />
          <Text variant="display">{passenger.name}</Text>
          <Text variant="small" tone="secondary">
            {`${formatPhone(passenger.phone)} · na sua rede desde ${longDate(passenger.since)}`}
          </Text>
        </View>

        {aviso ? (
          <Block style={styles.notice}>
            <Text variant="small" style={styles.noticeText} accessibilityLiveRegion="polite">
              {aviso}
            </Text>
            <Button label="Fechar" size="sm" variant="ghost" onPress={() => setAviso(null)} />
          </Block>
        ) : null}

        {esperando.length > 0 ? (
          <Block style={styles.info}>
            <Label>Esperando você</Label>
            <Text variant="body">
              {esperando.length === 1 ? `${firstName} mandou 1 pedido.` : `${firstName} mandou ${esperando.length} pedidos.`}
            </Text>
            <Button label="Abrir os pedidos" icon="inbox" size="sm" variant="light" onPress={() => router.push('/requests')} />
          </Block>
        ) : null}

        <View style={styles.stats}>
          <StatCard
            color={colors.cards[0]}
            title="Viagens concluídas"
            value={String(trips)}
            detailLabel={capitalize(monthName(now))}
            detail={current.trips > 0 ? String(current.trips) : '—'}
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

        <Pills
          items={[
            { key: 'combinado', label: combinadas.length > 0 ? `Combinado · ${combinadas.length}` : 'Combinado' },
            { key: 'gastos', label: 'Gastos por mês' },
          ]}
          selected={aba}
          onSelect={(key) => setAba(key as Aba)}
          accessibilityLabel="O que ver deste passageiro"
        />

        <View style={[styles.section, aba === 'combinado' ? null : styles.hidden]}>
          {combinadas.length > 0 ? (
            <View style={styles.list}>
              {combinadas.map((agenda) => (
                <Block key={agenda.id} style={styles.deal}>
                  <Text variant="bodyMedium">{whenLabel(agenda)}</Text>
                  <Text variant="small" tone="secondary">
                    {routeLabel(agenda)}
                  </Text>
                  <View style={styles.dealActions}>
                    <Text variant="bodyMedium" style={styles.dealPrice}>
                      {agenda.price != null ? formatPrice(agenda.price) : 'Sem valor combinado'}
                    </Text>
                    <Button label="Encerrar" icon="close" size="sm" variant="ghost" destructive onPress={() => setEnding(agenda.id)} />
                  </View>
                </Block>
              ))}
            </View>
          ) : (
            <Text variant="small" tone="secondary">
              {`Nada combinado com ${firstName} agora. Quando ele marcar pelo seu link, o pedido aparece em Pedidos.`}
            </Text>
          )}
        </View>

        <View style={[styles.section, aba === 'gastos' ? null : styles.hidden]}>
          {meses.some((m) => m.trips > 0) ? (
            <View style={styles.table}>
              {meses.map((m, index) => (
                <MonthRow
                  key={m.month.toISOString()}
                  spend={m}
                  current={index === 0}
                  first={index === 0}
                  last={index === meses.length - 1}
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

        {current.trips > 0 ? (
          <Button
            label={`Gerar cobrança de ${monthName(now)}`}
            icon="request_quote"
            variant="light"
            onPress={() => openMonth(current.month)}
            accessibilityHint="Abre Ganhos com as viagens do mês para mandar a cobrança no WhatsApp"
          />
        ) : null}

        {passenger.state === 'archived' ? <Button label="Tirar do arquivo" icon="undo" variant="light" onPress={arquivar} /> : null}
      </ScrollView>

      <TripOptions
        visible={options}
        title={passenger.name}
        onClose={() => setOptions(false)}
        options={[
          { key: 'call', label: `Ligar para ${firstName}`, icon: 'call', onPress: () => Linking.openURL(`tel:${passenger.phone}`) },
          { key: 'report', label: `Denunciar ${firstName}`, icon: 'flag' as const, onPress: () => setReporting(true) },
          ...(passenger.state === 'active'
            ? [{ key: 'archive', label: 'Arquivar passageiro', icon: 'person_remove' as const, destructive: true, onPress: arquivar }]
            : []),
        ]}
      />

      <ConfirmDialog
        visible={ending !== null}
        title="Encerrar este combinado?"
        text={`As viagens futuras saem da sua agenda e o horário volta a ficar livre no seu link. O que já aconteceu continua no histórico, e ${firstName} só fica sabendo quando você avisar.`}
        confirmLabel="Encerrar"
        confirmIcon="close"
        onConfirm={() => ending && encerrar(ending)}
        onClose={() => setEnding(null)}
      />

      <ConfirmDialog
        visible={reporting}
        title={`Denunciar ${firstName}?`}
        text={reportText(firstName)}
        confirmLabel="Escrever denúncia"
        confirmIcon="flag"
        onConfirm={() => {
          setReporting(false);
          Linking.openURL(reportUrl({ reported: passenger.name }));
        }}
        onClose={() => setReporting(false)}
      />
    </SafeAreaView>
  );
}

// Cartão de total. Mesma tipografia em todas as cores: título no topo, respiro, número principal
// e o secundário embaixo.
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
    <View
      style={[styles.stat, wide && styles.statWide, { backgroundColor: color }]}
      accessible
      accessibilityLabel={`${title}: ${value}. ${detailLabel}: ${detail}`}>
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

function MonthRow({ spend, current, first, last, onPress }: { spend: Mes; current: boolean; first: boolean; last: boolean; onPress: () => void }) {
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

const styles = StyleSheet.create({
  hidden: { display: 'none' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing[4],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    borderRadius: radius.sm,
  },
  tagActive: { backgroundColor: colors.text },
  tagArchived: { backgroundColor: colors.surfaceRaised },
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
  table: { gap: spacing[4] },
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
  list: { gap: layout.gap },
  deal: { gap: spacing[8], padding: spacing[16] },
  dealActions: { flexDirection: 'row', alignItems: 'center', gap: spacing[8], marginTop: spacing[4] },
  dealPrice: { flex: 1 },
  info: { gap: spacing[8], borderWidth: borderWidth.hairline, borderColor: colors.line },
});
