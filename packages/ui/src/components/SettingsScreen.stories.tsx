import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { SettingsScreen } from './SettingsScreen';

// Configurações dos dois apps: avisos (cada app com os seus), sair e excluir a conta.
const meta = {
  title: 'Telas/SettingsScreen',
  component: SettingsScreen,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    account: 'ana.souza@email.com',
    groups: [
      {
        title: 'Na hora da viagem',
        items: [
          { key: 'onTheWay', title: 'Motorista a caminho', text: 'Quando ele sair para te buscar.', value: true, onChange: fn() },
          { key: 'arrived', title: 'Motorista chegou', text: 'Com o carro e a placa, para você achar rápido.', value: true, onChange: fn() },
        ],
      },
      { title: 'Pedidos, conversas e cobranças', items: [{ key: 'message', title: 'Mensagens', text: 'Quando o motorista escreve no chat.', value: false, onChange: fn() }] },
    ],
    permission: 'granted',
    onRequestPermission: fn(),
    onOpenSystemSettings: fn(),
    onBack: fn(),
    onSignOut: fn(),
    onDelete: async () => null,
    deleteText: 'Suas viagens, rotinas, conversas e seu celular são apagados, e você sai da rede de todos os motoristas. Não dá para desfazer.',
  },
} satisfies Meta<typeof SettingsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: 'Padrão' };

export const NotificacoesBloqueadas: Story = { name: 'Notificações bloqueadas', args: { permission: 'denied' } };

export const PermissaoNaoPedida: Story = { name: 'Permissão ainda não pedida', args: { permission: 'undetermined' } };

export const SemSuporte: Story = { name: 'Navegador ou Expo Go', args: { permission: 'unsupported' } };
