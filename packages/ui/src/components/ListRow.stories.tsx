import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { ListGroup } from './ListGroup';
import { ListRow } from './ListRow';

// Linha de lista do Perfil. "Pendente" troca o texto por laranja com ícone de alerta (não só a cor).
const meta = {
  title: 'Componentes/Lista/ListRow',
  component: ListRow,
  tags: ['autodocs'],
  args: {
    icon: 'directions_car',
    title: 'Veículo',
    value: 'Onix prata · FTR4E21',
    pending: false,
    first: true,
    last: true,
    onPress: fn(),
  },
} satisfies Meta<typeof ListRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: 'Padrão' };

export const Pendente: Story = { args: { value: 'Adicione: aparece no aviso "Cheguei"', pending: true } };

// Dentro do ListGroup: o grupo arredonda só as pontas, e o rótulo vai em cima.
export const Grupo: Story = {
  render: (args) => (
    <ListGroup label="Sua agenda">
      <ListRow {...args} icon="chat" title="Seu WhatsApp" value="(41) 99876-5432" />
      <ListRow {...args} icon="link" title="Seu link" value="trustcab-9bab6.web.app/a/carlos" />
      <ListRow {...args} icon="schedule" title="Horários" value="segunda a sexta · 06:00 às 20:00" />
    </ListGroup>
  ),
};
