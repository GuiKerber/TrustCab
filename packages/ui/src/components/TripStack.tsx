import { StyleSheet, View } from 'react-native';

import { formatPrice, formatPriceShort, type Trip } from '@trustcab/core';
import { colors, radius, size, spacing } from '../theme/tokens';

import { CardStack, type CardOrigin } from './CardStack';
import { cardColor, isClosed, statusLabel } from './TripBlocks';
import { Icon, Label, Text } from './ui';

type TripStackProps = {
  trips: Trip[];
  // Nome em destaque no cartão. Motorista vê o passageiro; passageiro vê quem vai dirigir.
  personOf?: (trip: Trip) => string;
  onOpen: (trip: Trip, color: string, origin: CardOrigin | null) => void;
};

// Pilha de viagens do dia, em ordem de embarque. Cada cartão mostra passageiro e horário;
// puxar para cima revela os endereços e, puxando mais, abre a viagem.
export function TripStack({ trips, onOpen, personOf = (trip) => trip.passenger }: TripStackProps) {
  return (
    <CardStack
      items={trips}
      sizes={size.stack}
      keyOf={(trip) => trip.id}
      colorOf={cardColor}
      accessibilityLabelOf={(trip) => `${trip.time}, ${personOf(trip)}. ${statusLabel(trip)}. De ${trip.origin} para ${trip.destination}`}
      accessibilityHint="Abre os detalhes da viagem. Também dá para segurar o cartão e arrastar para cima."
      onOpen={onOpen}
      renderCard={(trip) => <TripCardContent trip={trip} person={personOf(trip)} />}
    />
  );
}

function TripCardContent({ trip, person }: { trip: Trip; person: string }) {
  const closed = isClosed(trip);
  const price = trip.priceCents % 100 === 0 ? formatPriceShort(trip.priceCents) : formatPrice(trip.priceCents);
  const tone = closed ? 'text' : 'onCard';
  const muted = closed ? 'secondary' : 'onCardMuted';

  return (
    <>
      <View style={styles.head}>
        <View style={styles.headText}>
          {/* "Próxima" não acrescentava nada: o horário e a ordem da pilha já dizem qual é.
              No lugar vai o valor, que some do cartão hoje e é a informação que falta.
              Quando a viagem sai do "agendada", o estado entra na frente do valor. */}
          <Label tone={muted}>{trip.status === 'scheduled' ? price : `${statusLabel(trip)} · ${price}`}</Label>
          <Text variant="heading" tone={tone} numberOfLines={1}>
            {person}
          </Text>
        </View>
        <Text variant="display" tone={tone}>
          {trip.time}
        </Text>
      </View>

      <View style={styles.body}>
        <Text variant="small" tone={muted} numberOfLines={1}>
          {trip.origin}
        </Text>
        <Text variant="small" tone={muted} numberOfLines={1}>
          → {trip.destination}
        </Text>
        <View style={styles.foot}>
          <Text variant="bodyMedium" tone={tone}>
            Ver detalhes
          </Text>
          {/* Sobre o cartão escuro o círculo inverte: claro com a seta em tinta. Com "surfaceRaised"
              ele ficava exatamente da cor do cartão e desaparecia. */}
          <View style={[styles.arrow, { backgroundColor: closed ? colors.text : colors.ink }]}>
            <Icon name="north_east" size={size.icon.sm} color={closed ? colors.ink : colors.text} />
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing[12] },
  headText: { flex: 1, gap: spacing[4], paddingTop: spacing[4] },
  body: { flex: 1, marginTop: spacing[16], gap: spacing[4] },
  foot: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: size.iconButton.md, height: size.iconButton.md, borderRadius: size.iconButton.md / 2, alignItems: 'center', justifyContent: 'center' },
});
