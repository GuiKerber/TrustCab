import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Block, Button, FormScreen, Label, spacing, Text } from '@trustcab/ui';
import { useVehicleForm } from '@/components/VehicleForm';
import { useProfile } from '@/data/profile';
import { driver } from '@trustcab/core';

// Veículo: modelo, cor e placa. Vão no aviso "Cheguei" para o passageiro achar o carro.
export default function Vehicle() {
  const profile = useProfile();
  const [saved, setSaved] = useState(false);
  const form = useVehicleForm({ onChange: () => setSaved(false) });

  return (
    <FormScreen
      backLabel="Voltar"
      onBack={() => router.back()}
      footer={<Button label="Salvar carro" icon="check" variant="light" onPress={() => setSaved(form.save())} />}>
      <View style={styles.head}>
        <Text variant="display">Seu</Text>
        <Text variant="display" tone="secondary">
          carro
        </Text>
        <Text variant="body" tone="secondary" style={styles.lead}>
          Quando você avisa que chegou, o passageiro recebe o modelo, a cor e a placa.
        </Text>
      </View>

      {form.fields}

      {saved && profile.vehicle ? (
        <Block style={styles.saved}>
          <Label>Assim aparece no aviso</Label>
          <Text variant="bodyMedium" accessibilityLiveRegion="polite">
            {`${driver.firstName} chegou · ${profile.vehicle.model} ${profile.vehicle.color}, placa ${profile.vehicle.plate}`}
          </Text>
        </Block>
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: spacing[4] },
  lead: { marginTop: spacing[12] },
  saved: { gap: spacing[4] },
});
