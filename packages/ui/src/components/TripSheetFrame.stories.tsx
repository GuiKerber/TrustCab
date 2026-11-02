import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { sampleMonth, type TripStatus } from '@trustcab/core';
import { colors } from '../theme/tokens';

import { Button } from './Button';
import { TripSheetFrame } from './TripSheetFrame';
import { Text } from './ui';

// A estrutura da folha da viagem, sem as regras do app: cor do cartão, horário, pessoa, percurso,
// valor, menu ⋯ e o rodapé que quem usa preenche. A versão completa do motorista está em Motorista/TripSheet.
const now = new Date();
const base = sampleMonth(now).days.flatMap((day) => day.trips)[0];

function FrameDemo({ status = 'scheduled', color = colors.cards[0] }: { status?: TripStatus; color?: string }) {
  return (
    <TripSheetFrame
      trip={{ ...base, status }}
      color={color}
      date={now}
      now={now}
      visible
      onClose={fn()}
      person={base.passenger}
      onChat={fn()}
      options={[{ key: 'undo', label: 'Desfazer "a caminho"', icon: 'undo', onPress: fn() }]}
      canCancel
      onCancel={fn()}
      completedBody={
        <Text variant="display" style={{ textAlign: 'center' }}>
          R$ 25
        </Text>
      }
      footer={({ actionVariant, onCard }) => <Button label="Ação do app" icon="arrow_forward" variant={actionVariant} onCard={onCard} onPress={fn()} />}
    />
  );
}

const meta = {
  title: 'Componentes/Viagem/TripSheetFrame',
  component: FrameDemo,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: { status: { control: 'select', options: ['scheduled', 'on_the_way', 'arrived', 'in_progress', 'completed', 'cancelled'] } },
} satisfies Meta<typeof FrameDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Agendada: Story = {};

export const EmViagem: Story = { name: 'Em viagem', args: { status: 'in_progress', color: colors.cards[2] } };

// Concluída: o fundo passa a cardDone e o percurso dá lugar ao que o app mostra (completedBody).
export const Concluida: Story = { name: 'Concluída', args: { status: 'completed' } };

export const Cancelada: Story = { args: { status: 'cancelled', color: colors.cardDone } };
