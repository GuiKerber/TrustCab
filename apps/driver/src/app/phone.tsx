import { Button, FormScreen, InfoBlock, PageHeader } from '@trustcab/ui';

import { usePhoneForm } from '@/components/PhoneForm';
import { goBack } from '@/lib/back';

// O WhatsApp do motorista. É o número que recebe o aviso de quem pediu pelo link, e é o número
// que abre quando o passageiro toca em "Avisar" na página. Sem ele o link não é gerado.
//
// Ele nunca aparece escrito na página de agendamento: entra só dentro do endereço do botão,
// depois que a pessoa manda o pedido.
export default function Phone() {
  const form = usePhoneForm();

  const salvar = async () => {
    if (await form.save()) goBack('/profile');
  };

  return (
    <FormScreen
      backLabel="Voltar"
      onBack={() => goBack('/profile')}
      footer={<Button label="Salvar" icon="check" variant="light" loading={form.busy} onPress={salvar} />}>
      <PageHeader title="Seu" subtitle="WhatsApp" lead="É por aqui que o passageiro fala com você depois de marcar pelo link." />

      {form.fields}

      <InfoBlock
        label="Quem vê"
        text="Só quem manda um pedido pelo seu link. O número não fica escrito na página, e ninguém consegue lê-lo só por abrir o endereço."
      />
    </FormScreen>
  );
}
