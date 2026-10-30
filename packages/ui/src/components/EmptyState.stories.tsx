import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { EmptyState } from './EmptyState';

// Lista vazia de propósito: contorno tracejado, desenho decorativo e o texto que diz o que fazer.
const meta = {
  title: 'Componentes/Estados/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  args: {
    art: 'viagens',
    title: 'Nenhuma viagem neste dia.',
    text: 'Mande seu link para quem já anda com você: os pedidos chegam aqui.',
    action: { label: 'Ver meu link', icon: 'link', onPress: fn() },
  },
  argTypes: { art: { control: 'inline-radio', options: ['viagens', 'passageiros', 'ganhos', 'pedidos'] } },
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Viagens: Story = {};

export const Passageiros: Story = {
  args: { art: 'passageiros', title: 'Ninguém na sua rede ainda', text: 'Quem marcar pelo seu link entra aqui sozinho, com nome e WhatsApp.' },
};

export const Ganhos: Story = {
  args: { art: 'ganhos', title: 'Nenhuma viagem concluída em outubro.', text: 'As viagens entram aqui quando você toca em "Concluir viagem".', action: undefined },
};

export const Pedidos: Story = {
  args: { art: 'pedidos', title: 'Nenhum pedido ainda', text: 'Quando alguém marcar pelo seu link, o pedido aparece aqui e seu celular avisa.' },
};
