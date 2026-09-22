import type { Meta, StoryObj } from '@storybook/react-native';
import { StyleSheet, View } from 'react-native';
import { fn } from 'storybook/test';

import { colors, radius, spacing } from '../theme/tokens';

import { Banner } from './Banner';

// Aviso dentro da tela: o que houve, o que fazer e o botão que resolve.
const meta = {
  title: 'Componentes/Avisos/Banner',
  component: Banner,
  tags: ['autodocs'],
  args: {
    icon: 'lock',
    tone: 'warning',
    title: 'Cadastre seu carro e sua chave Pix',
    text: 'Sem eles, você não consegue começar as viagens. O carro vai no aviso “Cheguei”; o Pix vira o QR Code do pagamento.',
    actions: [
      { label: 'Cadastrar carro', icon: 'directions_car', onPress: fn() },
      { label: 'Cadastrar Pix', icon: 'qr_code_2', onPress: fn() },
    ],
  },
  argTypes: { tone: { control: 'inline-radio', options: ['default', 'warning'] } },
} satisfies Meta<typeof Banner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CadastroFaltando: Story = { name: 'Cadastro faltando (Home)' };

export const Informativo: Story = {
  args: {
    icon: 'notifications',
    tone: 'default',
    title: 'Ative as notificações',
    text: 'Sem a permissão do celular, os avisos não aparecem.',
    actions: [{ label: 'Ativar', icon: 'notifications', onPress: fn() }],
  },
};

export const SemAcao: Story = { name: 'Sem ação', args: { icon: 'person_search', title: 'Você já convidou Rafael Costa neste número', actions: [] } };

export const SobreCartao: Story = {
  name: 'Sobre o cartão (folha da viagem)',
  args: {
    onCard: true,
    title: 'Cadastre seu carro e sua chave Pix para começar',
    text: 'O carro vai no aviso "Cheguei" para Ana te achar. O Pix vira o QR Code do pagamento.',
  },
  decorators: [
    (Story) => (
      <View style={styles.card}>
        <Story />
      </View>
    ),
  ],
};

const styles = StyleSheet.create({
  card: { backgroundColor: colors.cards[0], padding: spacing[20], borderRadius: radius.card },
});
