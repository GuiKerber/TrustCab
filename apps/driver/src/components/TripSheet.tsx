import type { AndroidSymbol } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { canStart, formatPrice, formatPriceShort, formatTime, isSameDay, relativeDay, START_WINDOW_MINUTES, startOpensAt, useNow, type Trip, type TripStatus } from '@trustcab/core';
import { Banner, Button, colors, Icon, IconButton, Label, size, spacing, Text, TripSheetFrame, type CardOrigin, type TripOption } from '@trustcab/ui';

import { missingSetup, PIX_TYPES, useProfile } from '@/data/profile';

type TripSheetProps = {
  trip: Trip | null;
  color: string;
  date: Date;
  now: Date;
  // Fica escondido (sem perder o estado) enquanto outra tela, como o chat, está por cima.
  visible: boolean;
  onClose: () => void;
  onStatus: (trip: Trip, status: TripStatus) => void;
  onMaps: (address: string) => void;
  onChat: (trip: Trip) => void;
  options: (trip: Trip) => TripOption[];
  onSpending: (trip: Trip) => void;
  // Cancelar pede confirmação e cancela só esta viagem.
  onCancel: (trip: Trip) => void;
  // Viagem concluída paga na hora pelo QR Code: sai da cobrança do mês.
  paid: boolean;
  // O passageiro avisou pelo app dele que já pagou: falta você confirmar.
  paidByPassenger?: boolean;
  onPaid: (trip: Trip, paid: boolean) => void;
  // Carro ou Pix faltando: leva para o cadastro.
  onSetup: (what: 'vehicle' | 'pix') => void;
  origin?: CardOrigin | null;
};

// Próximo passo de cada estado. O mapa ao lado leva até a partida antes do embarque e até o destino depois.
const NEXT_STEP: Partial<Record<TripStatus, { label: string; icon: AndroidSymbol; next: TripStatus; mapsTo: 'origin' | 'destination' }>> = {
  scheduled: { label: 'Estou a caminho', icon: 'directions_car', next: 'on_the_way', mapsTo: 'origin' },
  on_the_way: { label: 'Cheguei', icon: 'location_on', next: 'arrived', mapsTo: 'origin' },
  arrived: { label: 'Começar viagem', icon: 'arrow_forward', next: 'in_progress', mapsTo: 'destination' },
  in_progress: { label: 'Concluir viagem', icon: 'done_all', next: 'completed', mapsTo: 'destination' },
};

// Folha da viagem do motorista: a estrutura comum (TripSheetFrame) com os avisos a caminho → cheguei → começar → concluir,
// o bloqueio por horário, a exigência de carro e Pix e, na concluída, o QR Code Pix e "Marcar como pago".
export function TripSheet({
  trip,
  color,
  date,
  now,
  visible,
  onClose,
  onStatus,
  onMaps,
  onChat,
  options,
  onSpending,
  onCancel,
  paid,
  paidByPassenger = false,
  onPaid,
  onSetup,
  origin = null,
}: TripSheetProps) {
  const profile = useProfile();
  const missing = missingSetup(profile);
  // Relógio próprio, por minuto: o "Estou a caminho" libera sozinho quando chega a hora.
  const clock = useNow('minute');

  if (!trip) return null;

  const price = trip.priceCents % 100 === 0 ? formatPriceShort(trip.priceCents) : formatPrice(trip.priceCents);
  const firstName = trip.passenger.split(' ')[0];
  const next = NEXT_STEP[trip.status];
  const needsSetup = trip.status === 'scheduled' && missing.any;
  const locked = trip.status === 'scheduled' && !canStart(date, trip, clock);
  const opensAt = startOpensAt(date, trip);
  const opensText = isSameDay(opensAt, clock)
    ? `Libera às ${formatTime(opensAt)}, ${START_WINDOW_MINUTES / 60} hora antes da viagem.`
    : `Libera ${relativeDay(opensAt, clock).toLowerCase()}, às ${formatTime(opensAt)}.`;

  return (
    <TripSheetFrame
      trip={trip}
      color={color}
      date={date}
      now={now}
      visible={visible}
      onClose={onClose}
      person={trip.passenger}
      onChat={onChat}
      options={options(trip)}
      canCancel
      onCancel={onCancel}
      origin={origin}
      completedBody={<PixCharge price={price} firstName={firstName} paid={paid} />}
      footer={({ dark, onCard, muted, actionVariant }) => (
        <>
          {needsSetup ? (
            <Banner
              onCard={onCard}
              icon="lock"
              title="Cadastre seu carro e sua chave Pix para começar"
              text={`O carro vai no aviso "Cheguei" para ${firstName} te achar. O Pix vira o QR Code do pagamento.`}
              actions={[
                ...(missing.vehicle ? [{ label: 'Cadastrar carro', icon: 'directions_car' as const, onPress: () => onSetup('vehicle') }] : []),
                ...(missing.pix ? [{ label: 'Cadastrar Pix', icon: 'qr_code_2' as const, onPress: () => onSetup('pix') }] : []),
              ]}
            />
          ) : next ? (
            <View style={styles.locked}>
              <View style={styles.actions}>
                <Button
                  label={next.label}
                  icon={next.icon}
                  variant={actionVariant}
                  onCard={onCard}
                  style={styles.mainAction}
                  onPress={() => onStatus(trip, next.next)}
                  disabled={locked}
                  accessibilityHint={locked ? opensText : trip.status === 'scheduled' ? `Avisa ${firstName} que você saiu` : undefined}
                />
                <IconButton
                  name="map"
                  label={next.mapsTo === 'origin' ? 'Abrir a partida no Google Maps' : 'Abrir o destino no Google Maps'}
                  variant={actionVariant}
                  onCard={onCard}
                  onPress={() => onMaps(next.mapsTo === 'origin' ? trip.origin : trip.destination)}
                />
              </View>
              {locked ? (
                <View style={styles.lockedText}>
                  <Icon name="schedule" size={size.icon.sm} color={dark ? colors.textSecondary : colors.inkSecondary} />
                  <Text variant="small" tone={muted}>
                    {opensText}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
          {trip.status === 'completed' ? (
            paid ? (
              <View style={styles.paidRow} accessibilityLiveRegion="polite">
                <Icon name="check_circle" size={size.icon.md} color={colors.text} />
                <Text variant="bodyMedium" style={styles.paidText}>
                  Paga. Fica fora da cobrança do mês.
                </Text>
                <Button label="Desfazer" icon="undo" size="sm" variant="ghost" onPress={() => onPaid(trip, false)} />
              </View>
            ) : (
              <View style={styles.locked}>
                {paidByPassenger ? (
                  <View style={styles.paidRow} accessibilityLiveRegion="polite">
                    <Icon name="info" size={size.icon.md} color={colors.orange} />
                    <Text variant="bodyMedium" style={styles.paidText}>
                      {`${firstName} avisou que já pagou. Confira no seu banco e confirme.`}
                    </Text>
                  </View>
                ) : null}
                <Button
                  label={paidByPassenger ? 'Confirmar pagamento' : 'Marcar como pago'}
                  icon="paid"
                  variant="light"
                  onPress={() => onPaid(trip, true)}
                  accessibilityHint={`Use quando ${firstName} pagar. A viagem sai da cobrança do mês.`}
                />
              </View>
            )
          ) : null}
          {trip.status === 'completed' ? (
            <Button
              label="Ver gastos"
              icon="receipt_long"
              size="sm"
              variant="surface"
              onCard={onCard}
              onPress={() => onSpending(trip)}
              accessibilityHint={`Abre os gastos de ${firstName} no mês`}
            />
          ) : null}
          {trip.status === 'cancelled' ? (
            <Button
              label="Reativar viagem"
              icon="undo"
              variant={actionVariant}
              onCard={onCard}
              onPress={() => onStatus(trip, 'scheduled')}
              accessibilityHint={`Volta a viagem para a agenda e avisa ${firstName}`}
            />
          ) : null}
        </>
      )}
    />
  );
}

// Viagem concluída: só o valor e o QR Code do Pix, grande e no centro, para o passageiro ler com a câmera.
// Enquanto o QR não é gerado, fica o desenho de um QR apagado no lugar e a chave aparece em texto.
function PixCharge({ price, firstName, paid }: { price: string; firstName: string; paid: boolean }) {
  const { pix } = useProfile();
  if (paid) {
    return (
      <View style={styles.charge} accessible accessibilityLabel={`${price}, pago`}>
        <View style={styles.chargePrice}>
          <Label tone="secondary">Pago</Label>
          <Text variant="display">{price}</Text>
        </View>
        <Icon name="check_circle" size={size.icon['2xl']} color={colors.text} />
      </View>
    );
  }
  return (
    <View style={styles.charge}>
      <View style={styles.chargePrice}>
        <Label tone="secondary">Valor combinado</Label>
        <Text variant="display">{price}</Text>
      </View>
      <View style={styles.qr} accessible accessibilityLabel="Espaço do QR Code Pix. Crie sua chave Pix em Perfil para o código aparecer aqui.">
        <Icon name="qr_code_2" size={size.qr} color={colors.textSecondary} />
      </View>
      <View style={styles.chargeText}>
        <Text variant="small" style={styles.center}>
          {`Mostre o QR Code para ${firstName} pagar na hora.`}
        </Text>
        {pix ? (
          <Text variant="bodyMedium" style={styles.center} selectable>
            {`Chave Pix (${PIX_TYPES[pix.type].label}): ${pix.key}`}
          </Text>
        ) : (
          <Text variant="small" tone="secondary" style={styles.center}>
            Crie sua chave Pix em Perfil para ela aparecer aqui.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
  mainAction: { flex: 1 },
  locked: { gap: spacing[8] },
  lockedText: { flexDirection: 'row', alignItems: 'center', gap: spacing[6] },
  paidRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
  paidText: { flex: 1 },
  charge: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[20] },
  chargePrice: { alignItems: 'center', gap: spacing[4] },
  // Sem moldura: o código fica direto sobre o fundo escuro, em traço claro (o real vai em colors.text).
  qr: { width: size.qr, height: size.qr, alignItems: 'center', justifyContent: 'center' },
  chargeText: { gap: spacing[4], paddingHorizontal: spacing[20] },
  center: { textAlign: 'center' },
});
