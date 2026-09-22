import type { Meta, StoryObj } from '@storybook/react-native';

import { sampleInvites } from '@/data/sample';

import { InviteCard } from './InviteCard';

// Quem te convidou, antes de entrar na rede: nome e carro, sem telefone nem outros passageiros.
const meta = {
  title: 'Passageiro/InviteCard',
  component: InviteCard,
  tags: ['autodocs'],
  args: { driver: sampleInvites(new Date()).joao23 },
} satisfies Meta<typeof InviteCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: 'Padrão' };
