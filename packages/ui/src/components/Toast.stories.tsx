import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { Button } from './Button';
import { Toast } from './Toast';

// Confirmação curta do que deu certo, quando a tela não muda. Some sozinha e não leva botão.
const meta = {
  title: 'Componentes/Avisos/Toast',
  component: Toast,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { message: 'Link novo criado. O anterior parou de funcionar.', onHide: fn() },
} satisfies Meta<typeof Toast>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: 'Padrão' };

export const TextoLongo: Story = {
  name: 'Texto longo',
  args: { message: 'Combinado encerrado. As viagens futuras saíram da sua agenda; avise Ana pelo WhatsApp.' },
};

// Aparece ao tocar e some sozinho depois de motion.toast.
function Demo() {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <>
      <Button label="Salvar chave" icon="check" variant="light" onPress={() => setMessage('Chave Pix salva.')} />
      <Toast message={message} onHide={() => setMessage(null)} />
    </>
  );
}

export const AoTocar: Story = { name: 'Ao tocar', render: () => <Demo /> };
