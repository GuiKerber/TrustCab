import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { ListGroup } from './ListGroup';
import { TotalRow } from './TotalRow';

// Linha de total que abre o detalhe: período, contagem e valor alinhados em coluna.
const meta = {
  title: 'Componentes/Lista/TotalRow',
  component: TotalRow,
  tags: ['autodocs'],
  args: {
    title: 'Outubro',
    caption: 'até hoje',
    count: '40 viagens',
    value: 'R$ 1.000,00',
    onPress: fn(),
    accessibilityLabel: 'Outubro: 40 viagens, R$ 1.000,00. Abrir em Ganhos',
    first: true,
    last: true,
  },
} satisfies Meta<typeof TotalRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Sozinha: Story = {};

// Gastos por mês na página do passageiro: o grupo arredonda só as pontas.
export const Meses: Story = {
  render: (args) => (
    <ListGroup>
      <TotalRow {...args} />
      <TotalRow {...args} title="Setembro" caption={undefined} count="38 viagens" value="R$ 950,00" />
      <TotalRow {...args} title="Agosto" caption={undefined} count="1 viagem" value="R$ 25,00" />
    </ListGroup>
  ),
};
