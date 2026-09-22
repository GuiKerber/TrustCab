import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { plateError, setVehicle, useProfile } from '@/data/profile';
import { spacing, TextField } from '@trustcab/ui';


// Campos do carro (modelo, cor, placa), com validação. Usado em Veículo e no primeiro acesso.
// "save" valida e grava; devolve true quando deu certo.
export function useVehicleForm({ onChange }: { onChange?: () => void } = {}) {
  const profile = useProfile();
  const [model, setModel] = useState(profile.vehicle?.model ?? '');
  const [color, setColor] = useState(profile.vehicle?.color ?? '');
  const [plate, setPlate] = useState(profile.vehicle?.plate ?? '');
  const [errors, setErrors] = useState<{ model?: string; color?: string; plate?: string }>({});
  const colorRef = useRef<TextInput>(null);
  const plateRef = useRef<TextInput>(null);

  const save = () => {
    const next = {
      model: model.trim() ? undefined : 'Escreva o modelo, como "Onix".',
      color: color.trim() ? undefined : 'Escreva a cor, como "prata".',
      plate: plateError(plate) ?? undefined,
    };
    setErrors(next);
    if (next.model || next.color || next.plate) return false;
    setVehicle({ model: model.trim(), color: color.trim().toLowerCase(), plate: plate.replace(/[\s-]/g, '').toUpperCase() });
    return true;
  };

  const change = (setter: (value: string) => void, field: keyof typeof errors) => (value: string) => {
    setter(value);
    onChange?.();
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  const fields = (
    <View style={styles.form}>
      <TextField
        label="Modelo"
        value={model}
        onChangeText={change(setModel, 'model')}
        placeholder="Onix"
        autoCapitalize="words"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => colorRef.current?.focus()}
        error={errors.model}
      />
      <TextField
        ref={colorRef}
        label="Cor"
        value={color}
        onChangeText={change(setColor, 'color')}
        placeholder="Prata"
        autoCapitalize="none"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => plateRef.current?.focus()}
        error={errors.color}
      />
      <TextField
        ref={plateRef}
        label="Placa"
        value={plate}
        onChangeText={change((value) => setPlate(value.toUpperCase()), 'plate')}
        placeholder="ABC1D23"
        autoCapitalize="characters"
        returnKeyType="done"
        onSubmitEditing={save}
        error={errors.plate}
      />
    </View>
  );

  return { fields, save };
}

const styles = StyleSheet.create({
  form: { gap: spacing[20] },
});
