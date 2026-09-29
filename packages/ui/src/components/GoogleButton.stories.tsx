import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { GoogleButton } from './GoogleButton';

// Entrar com o Google. O formato segue as diretrizes de marca do Google, não os tokens de botão do TrustCab:
// símbolo de quatro cores, superfície branca e o texto exato. É o único botão do app que escapa da paleta.
const meta = {
  title: 'Componentes/Ações/GoogleButton',
  component: GoogleButton,
  tags: ['autodocs'],
  args: {
    loading: false,
    disabled: false,
    onPress: fn(),
  },
} satisfies Meta<typeof GoogleButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

export const Carregando: Story = { args: { loading: true } };

export const Desabilitado: Story = { args: { disabled: true } };
