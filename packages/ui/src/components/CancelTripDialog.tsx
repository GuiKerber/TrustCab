import type { Trip } from '@trustcab/core';

import { ConfirmDialog } from './ConfirmDialog';

// Confirmação antes de cancelar. Cancela só esta viagem: cada viagem é um pedido aprovado sozinho,
// então as outras do mesmo horário continuam marcadas. "other" é quem recebe o aviso (passageiro ou motorista).
export function CancelTripDialog({
  trip,
  other,
  onConfirm,
  onClose,
}: {
  trip: Trip | null;
  other: string;
  onConfirm: (trip: Trip) => void;
  onClose: () => void;
}) {
  if (!trip) return null;
  const firstName = other.split(' ')[0];
  return (
    <ConfirmDialog
      inline
      visible
      title={`Cancelar a viagem das ${trip.time}?`}
      text={`Só esta viagem é cancelada; as outras continuam marcadas. ${firstName} recebe um aviso na hora.`}
      confirmLabel="Cancelar viagem"
      confirmIcon="cancel"
      destructive
      onConfirm={() => onConfirm(trip)}
      onClose={onClose}
    />
  );
}
