import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button, FormScreen, PageHeader, Toast } from '@trustcab/ui';
import { usePixForm } from '@/components/PixForm';
import { setPix, useProfile } from '@/data/profile';
import { goBack } from '@/lib/back';

// Chave Pix: vai junto nas cobranças e gera o QR Code mostrado ao concluir a viagem.
// Salvar e remover confirmam com o aviso curto (Toast), como as outras ações que não mudam de tela.
export default function PixKey() {
  const profile = useProfile();
  const [feito, setFeito] = useState<string | null>(null);
  const form = usePixForm();

  return (
    <FormScreen
      backLabel="Voltar"
      onBack={() => goBack('/profile')}
      footer={
        <>
          <Button label={profile.pix ? 'Salvar nova chave' : 'Salvar chave'} icon="check" variant="light" onPress={() => form.save() && setFeito('Chave Pix salva. Ela já vai nas próximas cobranças.')} />
          {profile.pix ? (
            <Button
              label="Remover chave"
              size="sm"
              variant="ghost"
              destructive
              style={styles.center}
              accessibilityHint="Sem chave Pix, você não consegue começar viagens nem cobrar"
              onPress={() => {
                setPix(null);
                form.clear();
                setFeito('Chave Pix removida.');
              }}
            />
          ) : null}
        </>
      }>
      <PageHeader title="Chave" subtitle="Pix" lead="Vai junto nas cobranças do mês e vira o QR Code que o passageiro lê ao fim da viagem." />

      {form.fields}

      <Toast message={feito} onHide={() => setFeito(null)} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  center: { alignSelf: 'center' },
});
