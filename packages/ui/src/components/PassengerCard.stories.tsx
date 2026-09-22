import type { Meta, StoryObj } from '@storybook/react-native';
import { ScrollView } from 'react-native';
import { fn } from 'storybook/test';

import { samplePassengers } from '@trustcab/core';
import { colors, layout, size } from '../theme/tokens';

import { CardStack } from './CardStack';
import { PassengerCardContent } from './PassengerCard';

// Cartões de passageiro, empilhados como os da home e com o mesmo gesto. Mesma tipografia em qualquer cor.
const now = new Date();
const passengers = samplePassengers(now);

function PassengerStack({ pending = false }: { pending?: boolean }) {
  const items = passengers.filter((p) => (pending ? p.status === 'invited' : p.status === 'active'));
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: layout.scrollEnd }} showsVerticalScrollIndicator={false}>
      <CardStack
        items={items}
        sizes={size.passengerStack}
        keyOf={(p) => p.id}
        colorOf={(_, index) => (pending ? colors.cardDone : colors.cards[index % colors.cards.length])}
        accessibilityLabelOf={(p) => p.name}
        accessibilityHint="Abre a página do passageiro"
        onOpen={fn()}
        renderCard={(p, { dark }) =>
          pending ? (
            <PassengerCardContent name={p.name} dark={dark} subtitle="Convite enviado · há 3 dias" />
          ) : (
            <PassengerCardContent name={p.name} dark={dark} subtitle="8 viagens" month={{ label: 'Setembro', totalCents: 24000 }} />
          )
        }
      />
    </ScrollView>
  );
}

const meta = {
  title: 'Componentes/Cartões/PassengerCard',
  component: PassengerStack,
  tags: ['autodocs'],
} satisfies Meta<typeof PassengerStack>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ativos: Story = {};

export const Pendentes: Story = { args: { pending: true } };
