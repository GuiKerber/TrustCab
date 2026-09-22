import type { Trip } from '@trustcab/core';
import { colors, type CardOrigin } from '@trustcab/ui';

import { paymentState, type usePayments } from '@/data/payments';

import { PassengerTripSheet } from './PassengerTripSheet';
import type { useTripActions } from './useTripActions';

// A folha da viagem aberta, com o motorista dela e o estado do pagamento.
export function OpenTripSheet({
  trip,
  open,
  date,
  now,
  visible,
  actions,
  payments,
  onClose,
}: {
  trip: Trip | null;
  open: { color: string; origin: CardOrigin | null } | null;
  date: Date;
  now: Date;
  visible: boolean;
  actions: ReturnType<typeof useTripActions>;
  payments: ReturnType<typeof usePayments>;
  onClose: () => void;
}) {
  return (
    <PassengerTripSheet
      trip={trip}
      driver={trip ? actions.driverOf(trip) : null}
      color={open?.color ?? colors.cards[0]}
      origin={open?.origin}
      date={date}
      now={now}
      visible={visible}
      onClose={onClose}
      onChat={actions.openChat}
      options={trip ? actions.options(trip) : []}
      onCancel={actions.cancel}
      onComingDown={actions.comingDown}
      payment={trip ? paymentState(payments, trip.id, date, now) : 'due'}
      onReportPaid={actions.setPaid}
    />
  );
}

