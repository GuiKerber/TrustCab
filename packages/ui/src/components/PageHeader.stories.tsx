import type { Meta, StoryObj } from '@storybook/react-native';

import { PageHeader } from './PageHeader';
import { Tag } from './Tag';


// Título editorial de página: assunto, complemento apagado e o texto de apoio.
const meta = {
  title: 'Componentes/Estrutura/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  args: {
    title: 'Seu link',
    subtitle: 'de agenda',
    lead: 'Mande este link para quem anda com você. A pessoa escolhe o dia e o horário, e você confirma.',
  },
  argTypes: { size: { control: 'inline-radio', options: ['display', 'displaySm'] } },
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Editorial: Story = {};

export const SoTitulo: Story = { name: 'Só o título', args: { title: 'Pedidos', subtitle: undefined, lead: '2 pessoas esperando sua resposta.' } };

// Identificação: quem ou o quê, colado ao título.
export const ComMeta: Story = {
  name: 'Com meta (Perfil)',
  args: { title: 'Carlos Pereira', subtitle: undefined, lead: undefined, meta: 'carlos@email.com' },
};

export const PalavraLonga: Story = {
  name: 'Palavra longa (displaySm)',
  args: { title: 'Configurações', subtitle: undefined, lead: undefined, meta: 'carlos@email.com', size: 'displaySm' },
};

export const ComEtiqueta: Story = {
  name: 'Com etiqueta acima (passageiro)',
  args: {
    title: 'Ana Souza',
    subtitle: undefined,
    lead: undefined,
    meta: '(41) 99876-5432 · na sua rede desde 3 de março',
    above: <Tag label="Ativo" icon="check_circle" />,
  },
};
