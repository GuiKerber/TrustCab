import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { LoginScreen } from './LoginScreen';

// Login dos dois apps. Só a frase muda.
const meta = {
  title: 'Telas/LoginScreen',
  component: LoginScreen,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { brand: 'TrustCab Driver', headline: ['Dirija para', 'quem você', 'conhece.'], onSignIn: fn() },
} satisfies Meta<typeof LoginScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Motorista: Story = {};

export const Passageiro: Story = { args: { brand: 'TrustCab', headline: ['Vá com', 'quem você', 'conhece.'] } };

export const Entrando: Story = { args: { busy: true } };

export const SessaoExpirada: Story = { name: 'Sessão expirada', args: { notice: 'Sua sessão terminou. Entre de novo para continuar de onde parou.' } };

export const Erro: Story = { args: { error: 'Você fechou o login do Google antes de terminar. Toque em entrar para tentar de novo.' } };

export const Desenvolvimento: Story = {
  args: { dev: { text: 'Modo de desenvolvimento: no Expo Go o Google não deixa entrar. Veja as telas sem conta:', onEnter: fn() } },
};

// Site de portfólio: sem as chaves do Firebase, só a entrada com dados de exemplo.
export const Demonstracao: Story = {
  name: 'Demonstração',
  args: { onSignIn: undefined, dev: { text: 'Versão de demonstração: navegue pelo app com dados de exemplo, sem criar conta.', onEnter: fn() } },
};
