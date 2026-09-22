import { useState, type Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { borderWidth, colors, opacity, radius, size, spacing, type } from '../theme/tokens';

import { Icon, Text } from './ui';

type TextFieldProps = Pick<TextInputProps, 'value' | 'onChangeText' | 'placeholder' | 'keyboardType' | 'autoComplete' | 'autoCapitalize' | 'textContentType' | 'onSubmitEditing' | 'returnKeyType' | 'submitBehavior'> & {
  // Para encadear o foco: o "próximo" do teclado de um campo chama focus() no seguinte.
  ref?: Ref<TextInput>;
  label: string;
  // Texto de apoio abaixo do campo; some quando há erro.
  hint?: string;
  // O que houve e o que fazer. Troca a borda para laranja e mostra ícone + texto.
  error?: string;
  disabled?: boolean;
};

// Campo de texto. Estados: padrão, hover (web), foco, preenchido, erro e desabilitado.
export function TextField({ label, hint, error, disabled = false, ref, ...input }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  const borderColor = error ? colors.orange : focused ? colors.text : hovered ? colors.lineStrong : colors.line;

  return (
    <View style={[styles.wrapper, disabled && styles.disabled]}>
      <Text variant="small" tone="secondary" nativeID={`${label}-label`}>
        {label}
      </Text>
      <View
        style={[styles.box, { borderColor, borderWidth: focused || error ? borderWidth.strong : borderWidth.hairline }]}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}>
        <TextInput
          {...input}
          ref={ref}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.orange}
          accessibilityLabel={label}
          accessibilityLabelledBy={`${label}-label`}
          accessibilityHint={error ?? hint}
          accessibilityState={{ disabled }}
          style={styles.input}
        />
      </View>
      {error ? (
        <View style={styles.message} accessibilityLiveRegion="polite">
          <Icon name="error" size={size.icon.sm} color={colors.orange} />
          <Text variant="small" tone="orange" style={styles.messageText}>
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text variant="small" tone="secondary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing[6] },
  disabled: { opacity: opacity.disabled },
  box: { minHeight: size.field, borderRadius: radius.blockSm, backgroundColor: colors.surface, justifyContent: 'center' },
  input: { ...type.body, color: colors.text, paddingHorizontal: spacing[16], minHeight: size.field, outlineWidth: 0 },
  message: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[6] },
  messageText: { flex: 1 },
});
