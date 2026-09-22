import type { Meta, StoryObj } from '@storybook/react-native';
import { StyleSheet, View } from 'react-native';
import { fn } from 'storybook/test';

import { layout } from '../theme/tokens';

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

export const Grupo: Story = {
  render: (args) => (
    <View style={styles.group}>
      <ListRow {...args} icon="qr_code_2" title="Chave Pix" value="CPF · 123.456.789-00" first last={false} />
      <ListRow {...args} first={false} last={false} />
      <ListRow {...args} icon="share" title="Seu link de convite" value="trustcab.app/i/exemplo" first={false} last />
    </View>
  ),
};

const styles = StyleSheet.create({
  group: { gap: layout.hairline },
});
