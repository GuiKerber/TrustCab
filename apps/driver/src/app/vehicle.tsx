import { useState } from 'react';

import { Button, FormScreen, InfoBlock, PageHeader, Toast } from '@trustcab/ui';
import { useVehicleForm } from '@/components/VehicleForm';
import { useProfile } from '@/data/profile';
import { goBack } from '@/lib/back';
import { driver } from '@trustcab/core';

// Veículo: modelo, cor e placa. Vão no aviso "Cheguei" para o passageiro achar o carro.
// Salvar confirma com o aviso curto (Toast); a prévia do aviso fica na tela sempre que houver carro.
export default function Vehicle() {
  const profile = useProfile();
  const [feito, setFeito] = useState<string | null>(null);
  const form = useVehicleForm();

  return (
    <FormScreen
      backLabel="Voltar"
      onBack={() => goBack('/profile')}
      footer={<Button label="Salvar carro" icon="check" variant="light" onPress={() => form.save() && setFeito('Carro salvo.')} />}>
      <PageHeader title="Seu" subtitle="carro" lead="Quando você avisa que chegou, o passageiro recebe o modelo, a cor e a placa." />

      {form.fields}

      {profile.vehicle ? (
        <InfoBlock
          label="Assim aparece no aviso"
          value={`${driver.firstName} chegou · ${profile.vehicle.model} ${profile.vehicle.color}, placa ${profile.vehicle.plate}`}
        />
      ) : null}

      <Toast message={feito} onHide={() => setFeito(null)} />
    </FormScreen>
  );
}
