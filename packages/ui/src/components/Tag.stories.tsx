import type { Meta, StoryObj } from '@storybook/react-native';

import { Tag } from './Tag';

// Etiqueta de estado: forma e ícone além da cor.
const meta = {
  title: 'Componentes/Avisos/Tag',
  component: Tag,
  tags: ['autodocs'],
  args: { label: 'Ativo', icon: 'check_circle' },
  argTypes: { tone: { control: 'inline-radio', options: ['light', 'muted'] } },
} satisfies Meta<typeof Tag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ativo: Story = {};

export const Arquivado: Story = { args: { label: 'Arquivado', icon: 'inventory_2', tone: 'muted' } };

export const SemIcone: Story = { name: 'Sem ícone', args: { icon: undefined } };
