import type { Meta, StoryObj } from '@storybook/react-native';
import { StyleSheet, View } from 'react-native';

import { Button, spacing } from '@trustcab/ui';

import { usePixForm } from './PixForm';
import { useVehicleForm } from './VehicleForm';

// Campos de carro e de chave Pix. Os mesmos no primeiro acesso, em Veículo e em Chave Pix.
// Tocar em salvar com campos vazios ou errados mostra o erro de cada campo.
function VehicleDemo() {
  const form = useVehicleForm();
  return (
    <View style={styles.column}>
      {form.fields}
      <Button label="Salvar carro" icon="check" variant="light" onPress={form.save} />
    </View>
  );
}

function PixDemo() {
  const form = usePixForm();
  return (
    <View style={styles.column}>
      {form.fields}
      <Button label="Salvar chave" icon="check" variant="light" onPress={form.save} />
    </View>
  );
}

const meta = {
  title: 'Motorista/Cadastro (carro e Pix)',
  component: VehicleDemo,
  tags: ['autodocs'],
} satisfies Meta<typeof VehicleDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Carro: Story = {};

export const ChavePix: StoryObj<typeof PixDemo> = { name: 'Chave Pix', render: () => <PixDemo /> };

const styles = StyleSheet.create({
  column: { gap: spacing[20] },
});
