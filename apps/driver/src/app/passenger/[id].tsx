import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import {
  BackBar,
  Banner,
  Block,
  Button,
  colors,
  ConfirmDialog,
  IconButton,
  InlineNotice,
  layout,
  ListGroup,
  PageHeader,
  Pills,
  ScreenStatus,
  ScrollScreen,
  spacing,
  StatCard,
  Tag,
  Text,
  Toast,
  TotalRow,
  TripOptions,
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
  // Deu certo: aviso curto que some sozinho. Deu errado: fica na tela até a próxima tentativa.
  const [feito, setFeito] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

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
      <ScrollScreen tabBar={false}>
        <BackBar onBack={() => goBack('/passengers')} />
        <PageHeader title="Não encontramos" subtitle="este passageiro" lead="Volte para a lista e tente de novo." />
      </ScrollScreen>
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
    setErro(null);
    try {
      await (arquivado ? restorePassenger(passenger.id) : archivePassenger(passenger.id));
      setFeito(arquivado ? `${firstName} voltou para a sua lista.` : `${firstName} foi para o arquivo.`);
    } catch {
      setErro('Não deu para salvar. Confira sua internet e tente de novo.');
    }
  };

  const encerrar = async (agendaId: string) => {
    setEnding(null);
    setErro(null);
    try {
      await endAgenda(agendaId, 'driver');
      setFeito(`Combinado encerrado. Avise ${firstName} pelo WhatsApp.`);
    } catch {
      setErro('Não deu para encerrar agora. Confira sua internet e tente de novo.');
    }
  };

  // Opções, confirmações e o aviso do que deu certo: por cima da tela, fora da rolagem.
  const overlays = (
    <>
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

      <Toast message={feito} onHide={() => setFeito(null)} />
    </>
  );

  return (
    <ScrollScreen tabBar={false} overlay={overlays}>
      <BackBar
        onBack={() => goBack('/passengers')}
        trailing={
          <>
            <IconButton name="chat" label={`Conversar com ${firstName} no WhatsApp`} onPress={() => sendTo(passenger.phone, '')} />
            <IconButton name="more_horiz" label="Mais opções" onPress={() => setOptions(true)} />
          </>
        }
      />

      <PageHeader
        above={passenger.state === 'archived' ? <Tag label="Arquivado" icon="inventory_2" tone="muted" /> : <Tag label="Ativo" icon="check_circle" />}
        title={passenger.name}
        meta={`${formatPhone(passenger.phone)} · na sua rede desde ${longDate(passenger.since)}`}
      />

      {erro ? <InlineNotice tone="warning" text={erro} /> : null}

      {esperando.length > 0 ? (
        <Banner
          icon="inbox"
          title="Esperando você"
          text={esperando.length === 1 ? `${firstName} mandou 1 pedido.` : `${firstName} mandou ${esperando.length} pedidos.`}
          actions={[{ label: 'Abrir os pedidos', icon: 'inbox', onPress: () => router.push('/requests') }]}
        />
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
          <ListGroup>
            {meses.map((m, index) => {
              const mes = capitalize(monthName(m.month));
              return (
                <TotalRow
                  key={m.month.toISOString()}
                  title={mes}
                  caption={index === 0 ? 'até hoje' : undefined}
                  count={m.trips === 1 ? '1 viagem' : `${m.trips} viagens`}
                  value={formatPrice(m.totalCents)}
                  onPress={() => openMonth(m.month)}
                  accessibilityLabel={`${mes}: ${m.trips} viagens, ${formatPrice(m.totalCents)}. Abrir em Ganhos`}
                />
              );
            })}
          </ListGroup>
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
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  hidden: { display: 'none' },
  stats: { flexDirection: 'row', gap: layout.gap },
  section: { gap: spacing[12] },
  list: { gap: layout.gap },
  deal: { gap: spacing[8], padding: spacing[16] },
  dealActions: { flexDirection: 'row', alignItems: 'center', gap: spacing[8], marginTop: spacing[4] },
  dealPrice: { flex: 1 },
});
