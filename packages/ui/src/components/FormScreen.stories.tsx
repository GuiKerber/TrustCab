import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { Button } from './Button';
import { FormScreen } from './FormScreen';
import { TextField } from './TextField';
import { Text } from './ui';

// Estrutura das telas com campos: voltar no topo, conteúdo que rola por cima do teclado e ação principal sempre visível.
function FormDemo({ loading = false }: { loading?: boolean }) {
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  return (
    <FormScreen
      backLabel="Voltar para o perfil"
      onBack={fn()}
      footer={<Button label="Salvar carro" icon="check" variant="light" loading={loading} onPress={fn()} />}>
      <Text variant="display">Seu carro</Text>
      <TextField label="Modelo" value={model} onChangeText={setModel} placeholder="Onix" />
      <TextField label="Placa" value={plate} onChangeText={(v) => setPlate(v.toUpperCase())} placeholder="ABC1D23" autoCapitalize="characters" />
    </FormScreen>
  );
}

const meta = {
  title: 'Componentes/Estrutura/FormScreen',
  component: FormDemo,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FormDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: 'Padrão' };

export const Salvando: Story = { args: { loading: true } };
