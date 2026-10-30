import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { BackBar } from './BackBar';
import { IconButton } from './Button';

// Topo das telas abertas por cima das abas: voltar e as ações da tela. Sem internet, a faixa aparece embaixo.
const meta = {
  title: 'Componentes/Navegação/BackBar',
  component: BackBar,
  tags: ['autodocs'],
  args: { onBack: fn(), backLabel: 'Voltar para o perfil' },
} satisfies Meta<typeof BackBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: 'Padrão' };

export const ComAcoes: Story = {
  name: 'Com ações (passageiro)',
  args: {
    trailing: (
      <>
        <IconButton name="chat" label="Conversar com Ana no WhatsApp" onPress={fn()} />
        <IconButton name="more_horiz" label="Mais opções" onPress={fn()} />
      </>
    ),
  },
};

// Primeiro passo do primeiro acesso: não há para onde voltar.
export const SemVoltar: Story = { name: 'Sem voltar', args: { onBack: undefined } };
