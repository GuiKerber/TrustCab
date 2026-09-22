import type { AndroidSymbol } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { formatPrice, formatPriceShort, type Trip } from '@trustcab/core';
import { Banner, Button, colors, Icon, Label, size, spacing, Text, TripSheetFrame, type CardOrigin, type TripOption } from '@trustcab/ui';

import type { PaymentState } from '@/data/payments';
import type { Driver } from '@/data/sample';

type PassengerTripSheetProps = {
  trip: Trip | null;
  driver: Driver | null;
  color: string;
  date: Date;
  now: Date;
  visible: boolean;
  onClose: () => void;
  onChat: (trip: Trip) => void;
  options: TripOption[];
  onCancel: (trip: Trip) => void;
  // Resposta rápida quando o motorista chega: vira mensagem no chat dele.
  onComingDown: (trip: Trip) => void;
  payment: PaymentState;
  onReportPaid: (trip: Trip, paid: boolean) => void;
  origin?: CardOrigin | null;
};

// O que o passageiro vê em cada momento da viagem, em ícone + texto.
const MOMENT: Partial<Record<Trip['status'], { icon: AndroidSymbol; title: (first: string) => string; text: (first: string) => string }>> = {
  requested: {
    icon: 'hourglass_top',
    title: (first) => `Esperando ${first} aprovar`,
    text: () => 'Você recebe um aviso quando a resposta chegar. Até lá, a viagem não está confirmada.',
  },
  declined: {
    icon: 'event_busy',
    title: (first) => `${first} não pode fazer esta viagem`,
    text: (first) => `As outras viagens da rotina seguem como estão. Se quiser, combine outro horário com ${first} pelo chat.`,
  },
  scheduled: {
    icon: 'event_available',
    title: () => 'Viagem confirmada',
    text: (first) => `Você recebe um aviso quando ${first} sair para te buscar.`,
  },
  on_the_way: {
    icon: 'directions_car',
    title: (first) => `${first} está a caminho`,
    text: () => 'Fique de olho: você recebe outro aviso quando o carro chegar.',
  },
  in_progress: {
    icon: 'route',
    title: () => 'Em viagem',
    text: (first) => `Quando chegar ao destino, ${first} conclui a viagem e o pagamento aparece aqui.`,
  },
  cancelled: {
    icon: 'cancel',
    title: () => 'Viagem cancelada',
    text: () => 'As outras viagens da rotina continuam marcadas.',
  },
};

// Primeiro ponto do percurso do lado do passageiro: onde o motorista está.
function driverStart(trip: Trip, first: string) {
  if (trip.status === 'on_the_way') return { label: first, text: 'A caminho de você' };
  if (trip.status === 'arrived' || trip.status === 'in_progress' || trip.status === 'completed') return { label: first, text: 'Chegou na partida' };
  return { label: first, text: 'Ainda não saiu' };
}

// Folha da viagem do passageiro: a mesma estrutura do motorista, com quem dirige e o carro em destaque.
// Mostra em que pé a viagem está (esperando aprovação, confirmada, a caminho, chegou) e, na concluída, o pagamento.
export function PassengerTripSheet({
  trip,
  driver,
  color,
  date,
  now,
  visible,
  onClose,
  onChat,
  options,
  onCancel,
  onComingDown,
  payment,
  onReportPaid,
  origin = null,
}: PassengerTripSheetProps) {
  if (!trip) return null;

  const name = driver?.name ?? trip.driver ?? 'Motorista';
  const first = name.split(' ')[0];
  const car = driver ? `${driver.vehicle.model} ${driver.vehicle.color} · ${driver.vehicle.plate}` : undefined;
  const price = trip.priceCents % 100 === 0 ? formatPriceShort(trip.priceCents) : formatPrice(trip.priceCents);
  const moment = MOMENT[trip.status];

  return (
    <TripSheetFrame
      trip={trip}
      color={color}
      date={date}
      now={now}
      visible={visible}
      onClose={onClose}
      person={name}
      personDetail={car}
      start={driverStart(trip, first)}
      etaLabel="Tempo de viagem"
      onChat={onChat}
      options={options}
      canCancel={trip.status === 'scheduled' || trip.status === 'requested'}
      onCancel={onCancel}
      origin={origin}
      completedBody={<PayPanel price={price} driver={driver} first={first} payment={payment} />}
      footer={({ onCard }) => (
        <>
          {trip.status === 'arrived' ? (
            <>
              <Banner
                onCard={onCard}
                icon="location_on"
                title={`${first} chegou`}
                text={car ? `Procure o ${car.replace(' · ', ', placa ')}.` : undefined}
              />
              <Button label="Estou descendo" icon="directions_walk" variant="ink" onCard={onCard} onPress={() => onComingDown(trip)} />
            </>
          ) : moment ? (
            <Banner onCard={onCard} icon={moment.icon} title={moment.title(first)} text={moment.text(first)} />
          ) : null}
          {trip.status === 'completed' ? (
            payment === 'due' ? (
              <Button
                label="Já paguei"
                icon="paid"
                variant="light"
                onPress={() => onReportPaid(trip, true)}
                accessibilityHint={`Avisa ${first} que você pagou. ${first} confere e confirma.`}
              />
            ) : payment === 'reported' ? (
              <View style={styles.row} accessibilityLiveRegion="polite">
                <Icon name="schedule" size={size.icon.md} color={colors.text} />
                <Text variant="bodyMedium" style={styles.grow}>
                  {`Você avisou que pagou. Falta ${first} confirmar.`}
                </Text>
                <Button label="Desfazer" icon="undo" size="sm" variant="ghost" onPress={() => onReportPaid(trip, false)} />
              </View>
            ) : null
          ) : null}
        </>
      )}
    />
  );
}

// Viagem concluída do lado do passageiro: valor, estado do pagamento e a chave Pix de quem dirigiu.
function PayPanel({ price, driver, first, payment }: { price: string; driver: Driver | null; first: string; payment: PaymentState }) {
  const paid = payment === 'paid';
  return (
    <View style={styles.pay}>
      <View style={styles.price}>
        <Label tone="secondary">{paid ? 'Paga' : payment === 'reported' ? 'Esperando confirmar' : 'A pagar'}</Label>
        <Text variant="display">{price}</Text>
      </View>
      {paid ? (
        <Icon name="check_circle" size={size.icon['2xl']} color={colors.text} />
      ) : driver ? (
        <View style={styles.key}>
          <Text variant="small" tone="secondary" style={styles.center}>
            {`Pague pelo Pix de ${first} ou lendo o QR Code que ${first} mostra no celular.`}
          </Text>
          <Text variant="bodyMedium" style={styles.center} selectable>
            {`${driver.pix.label}: ${driver.pix.key}`}
          </Text>
          <Text variant="label" tone="secondary" style={styles.center}>
            Toque e segure a chave para copiar
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
  grow: { flex: 1 },
  pay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[20] },
  price: { alignItems: 'center', gap: spacing[4] },
  key: { gap: spacing[4], paddingHorizontal: spacing[20] },
  center: { textAlign: 'center' },
});
