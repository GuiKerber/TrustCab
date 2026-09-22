import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { ConfirmDialog } from './ConfirmDialog';

// Confirmação que sobe do rodapé: pergunta, consequência e duas saídas.
const meta = {
  title: 'Componentes/Camadas/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    visible: true,
    inline: true,
    title: 'Sair da conta?',
    text: 'Seus dados continuam guardados. Para voltar, é só entrar de novo com o Google.',
    confirmLabel: 'Sair',
    confirmIcon: 'logout',
    onConfirm: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SairDaConta: Story = { name: 'Sair da conta' };

export const ExcluirConta: Story = {
  name: 'Excluir conta',
  args: {
    title: 'Excluir sua conta?',
    text: 'Seus passageiros, viagens, conversas, chave Pix e carro são apagados, e todas as conexões são encerradas. Não dá para desfazer.',
    confirmLabel: 'Excluir conta de vez',
    confirmIcon: 'delete_forever',
    confirmVariant: 'danger',
  },
};

export const Excluindo: Story = { args: { ...ExcluirConta.args, loading: true } };

export const ErroAoExcluir: Story = {
  name: 'Erro ao excluir',
  args: { ...ExcluirConta.args, error: 'Por segurança, saia, entre de novo com o Google e tente excluir outra vez.' },
};

export const NovoLink: Story = {
  name: 'Gerar novo link',
  args: {
    title: 'Gerar um link novo?',
    text: 'O link atual para de funcionar na hora. Quem já está na sua rede continua; quem ainda não entrou vai precisar do link novo.',
    confirmLabel: 'Gerar novo link',
    confirmIcon: 'autorenew',
  },
};
