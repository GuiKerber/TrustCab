import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { BackBar } from './BackBar';
import { PageHeader } from './PageHeader';
import { ScrollScreen } from './ScrollScreen';
import { TopBar } from './TopBar';
import { Block, Text } from './ui';

// Tela que rola, sem campos: margem, topo, intervalo entre blocos e o fim da rolagem iguais em todas.
function Blocks() {
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <Block key={i}>
          <Text variant="bodyMedium">{`Bloco ${i + 1}`}</Text>
        </Block>
      ))}
    </>
  );
}

const meta = {
  title: 'Componentes/Estrutura/ScrollScreen',
  component: ScrollScreen,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    children: (
      <>
        <TopBar title="Passageiros" action={{ icon: 'link', label: 'Ver meu link', onPress: fn() }} />
        <PageHeader title="Sua rede" subtitle="de confiança" lead="Mande seu link para quem já anda com você." />
        <Blocks />
      </>
    ),
  },
} satisfies Meta<typeof ScrollScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

// Nas abas o fim da rolagem deixa espaço para o menu flutuante.
export const Aba: Story = {};

export const ForaDasAbas: Story = {
  name: 'Fora das abas (passageiro)',
  args: {
    tabBar: false,
    children: (
      <>
        <BackBar onBack={fn()} />
        <PageHeader title="Ana Souza" meta="(41) 99876-5432 · na sua rede desde 3 de março" />
        <Blocks />
      </>
    ),
  },
};
