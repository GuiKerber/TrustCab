import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { sampleMonth } from '@trustcab/core';

import { CancelTripDialog } from './CancelTripDialog';

// Confirmação antes de cancelar. Cancela só esta viagem; as outras do mesmo horário continuam marcadas.
const trip = sampleMonth(new Date()).days.flatMap((day) => day.trips)[0];

const meta = {
  title: 'Componentes/Camadas/CancelTripDialog',
  component: CancelTripDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { trip, other: trip.passenger, onConfirm: fn(), onClose: fn() },
} satisfies Meta<typeof CancelTripDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: 'Padrão' };
