import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { ListGroup } from './ListGroup';
import { ListRow } from './ListRow';

// Linhas em blocos conectados: o grupo arredonda só as pontas, para nenhuma tela contar primeira e última à mão.
const meta = {
  title: 'Componentes/Lista/ListGroup',
  component: ListGroup,
  tags: ['autodocs'],
  args: {
    label: 'Sua agenda',
    children: [
      <ListRow key="phone" icon="chat" title="Seu WhatsApp" value="(41) 99876-5432" onPress={fn()} />,
      <ListRow key="link" icon="link" title="Seu link" value="trustcab-9bab6.web.app/a/carlos" onPress={fn()} />,
      <ListRow key="hours" icon="schedule" title="Horários" value="segunda a sexta · 06:00 às 20:00" onPress={fn()} />,
    ],
  },
} satisfies Meta<typeof ListGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Grupo: Story = {};

// Uma linha só: é primeira e última ao mesmo tempo, com os quatro cantos grandes.
export const UmaLinha: Story = {
  name: 'Uma linha',
  args: { label: 'Recebimento', children: <ListRow icon="qr_code_2" title="Chave Pix" value="CPF · 123.456.789-00" onPress={fn()} /> },
};

export const SemRotulo: Story = { name: 'Sem rótulo', args: { label: undefined } };
