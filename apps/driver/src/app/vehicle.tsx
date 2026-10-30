import { useState } from 'react';

import { Button, FormScreen, InfoBlock, PageHeader } from '@trustcab/ui';
import { useVehicleForm } from '@/components/VehicleForm';
import { useProfile } from '@/data/profile';
import { goBack } from '@/lib/back';
import { driver } from '@trustcab/core';

// Veículo: modelo, cor e placa. Vão no aviso "Cheguei" para o passageiro achar o carro.
export default function Vehicle() {
  const profile = useProfile();
  const [saved, setSaved] = useState(false);
  const form = useVehicleForm({ onChange: () => setSaved(false) });

  return (
    <FormScreen
      backLabel="Voltar"
      onBack={() => goBack('/profile')}
      footer={<Button label="Salvar carro" icon="check" variant="light" onPress={() => setSaved(form.save())} />}>
      <PageHeader title="Seu" subtitle="carro" lead="Quando você avisa que chegou, o passageiro recebe o modelo, a cor e a placa." />

      {form.fields}

      {saved && profile.vehicle ? (
        <InfoBlock
          label="Assim aparece no aviso"
          value={`${driver.firstName} chegou · ${profile.vehicle.model} ${profile.vehicle.color}, placa ${profile.vehicle.plate}`}
          live
        />
      ) : null}
    </FormScreen>
  );
}
