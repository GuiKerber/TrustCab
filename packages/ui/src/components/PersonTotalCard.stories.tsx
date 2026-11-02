import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { colors } from '../theme/tokens';

import { ListGroup } from './ListGroup';
import { PersonTotalCard } from './PersonTotalCard';

// Total de uma pessoa no mês (Ganhos). Cores diferentes, mesma tipografia.
const meta = {
  title: 'Componentes/Cartões/PersonTotalCard',
  component: PersonTotalCard,
  tags: ['autodocs'],
  args: {
    name: 'Ana Souza',
    caption: '40 viagens',
    total: 'R$ 1.000',
    color: colors.cards[0],
    onPress: fn(),
    accessibilityLabel: 'Ana Souza: R$ 1.000,00 em 40 viagens. Ver só as viagens de Ana',
    first: true,
    last: true,
  },
} satisfies Meta<typeof PersonTotalCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Sozinho: Story = {};

export const NomeLongo: Story = { name: 'Nome longo', args: { name: 'Maria Aparecida dos Santos Oliveira', total: 'R$ 12.480' } };

// Ganhos com vários passageiros: o grupo arredonda só as pontas.
export const Grupo: Story = {
  render: (args) => (
    <ListGroup>
      {['Ana Souza', 'Júlia Rocha', 'Pedro Lima', 'Marina Alves', 'Rafael Costa'].map((name, index) => (
        <PersonTotalCard key={name} {...args} name={name} color={colors.cards[index]} />
      ))}
    </ListGroup>
  ),
};
