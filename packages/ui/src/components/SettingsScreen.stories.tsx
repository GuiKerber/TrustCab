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
    account: 'carlos.pereira@email.com',
    groups: [
      {
        title: 'Viagens',
        items: [
          { key: 'tripReminder', title: 'Hora de sair', text: 'Quando libera o "Estou a caminho", 1 hora antes da viagem.', value: true, onChange: fn() },
          { key: 'forgottenTrip', title: 'Viagem sem conclusão', text: 'Se uma viagem passou do horário e você não concluiu.', value: true, onChange: fn() },
        ],
      },
      {
        title: 'Do servidor',
        items: [
          {
            key: 'serverPush',
            title: 'Pedidos e lembretes',
            text: 'Quando alguém marca pelo seu link, a lista das viagens de amanhã e o fim do mês grátis.',
            value: false,
            onChange: fn(),
          },
        ],
      },
    ],
    permission: 'granted',
    onRequestPermission: fn(),
    onOpenSystemSettings: fn(),
    onBack: fn(),
    onSignOut: fn(),
    onDelete: async () => null,
    deleteText: 'Seu link sai do ar na hora, e seus passageiros, agendas, viagens, chave Pix e carro são apagados. Não dá para desfazer.',
  },
} satisfies Meta<typeof SettingsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: 'Padrão' };

export const NotificacoesBloqueadas: Story = { name: 'Notificações bloqueadas', args: { permission: 'denied' } };

export const PermissaoNaoPedida: Story = { name: 'Permissão ainda não pedida', args: { permission: 'undetermined' } };

export const SemSuporte: Story = { name: 'Navegador ou Expo Go', args: { permission: 'unsupported' } };
