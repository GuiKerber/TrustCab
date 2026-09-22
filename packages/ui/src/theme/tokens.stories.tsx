import type { Meta, StoryObj } from '@storybook/react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '../components/ui';

import {
  borderWidth,
  colors,
  gesture,
  gradient,
  layout,
  motion,
  opacity,
  palette,
  radius,
  size,
  spacing,
  spring,
  type,
} from './tokens';

// Fundamentos: tudo o que as telas usam vem daqui. Nenhum componente tem cor, tamanho ou tempo solto.
const meta = {
  title: 'Fundamentos/Tokens',
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="title">{title}</Text>
      {children}
    </View>
  );
}

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <View style={styles.swatchRow}>
      <View style={[styles.swatch, { backgroundColor: value }]} />
      <View style={styles.swatchText}>
        <Text variant="bodyMedium">{name}</Text>
        <Text variant="small" tone="secondary">
          {value}
        </Text>
      </View>
    </View>
  );
}

function flatten(prefix: string, value: unknown): { name: string; value: string }[] {
  if (typeof value === 'string') return [{ name: prefix, value }];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, inner]) => flatten(prefix ? `${prefix}.${key}` : key, inner));
}

function Scroll({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

export const Cores: Story = {
  render: () => (
    <Scroll>
      <Section title="Semânticas">
        {flatten('colors', colors).map((c) => (
          <Swatch key={c.name} {...c} />
        ))}
      </Section>
      <Section title="Primitivas">
        {flatten('palette', palette).map((c) => (
          <Swatch key={c.name} {...c} />
        ))}
      </Section>
    </Scroll>
  ),
};

export const Tipografia: Story = {
  render: () => (
    <Scroll>
      {(Object.keys(type) as (keyof typeof type)[]).map((variant) => (
        <View key={variant} style={styles.typeRow}>
          <Text variant="label" tone="secondary">
            {`${variant} · ${type[variant].fontSize}/${type[variant].lineHeight}`}
          </Text>
          <Text variant={variant} numberOfLines={1}>
            {variant === 'hero' ? '07:40' : 'Dirija para quem você conhece'}
          </Text>
        </View>
      ))}
    </Scroll>
  ),
};

function Measure({ name, value, children }: { name: string; value: number | string; children?: React.ReactNode }) {
  return (
    <View style={styles.measureRow}>
      <View style={styles.measureLabel}>
        <Text variant="bodyMedium">{name}</Text>
        <Text variant="small" tone="secondary">
          {String(value)}
        </Text>
      </View>
      {children}
    </View>
  );
}

export const Espaco: Story = {
  name: 'Espaço',
  render: () => (
    <Scroll>
      <Section title="spacing">
        {Object.entries(spacing).map(([key, value]) => (
          <Measure key={key} name={`spacing[${key}]`} value={value}>
            <View style={[styles.bar, { width: value }]} />
          </Measure>
        ))}
      </Section>
      <Section title="layout">
        {Object.entries(layout).map(([key, value]) => (
          <Measure key={key} name={`layout.${key}`} value={value} />
        ))}
      </Section>
    </Scroll>
  ),
};

export const Raios: Story = {
  render: () => (
    <Scroll>
      <Section title="radius">
        <Text variant="small" tone="secondary">
          Pílulas e círculos não têm token: o raio é sempre metade da altura.
        </Text>
        <View style={styles.grid}>
          {Object.entries(radius).map(([key, value]) => (
            <View key={key} style={styles.radiusItem}>
              <View style={[styles.radiusBox, { borderRadius: value }]} />
              <Text variant="small">{`${key} · ${value}`}</Text>
            </View>
          ))}
        </View>
      </Section>
      <Section title="borderWidth">
        {Object.entries(borderWidth).map(([key, value]) => (
          <Measure key={key} name={`borderWidth.${key}`} value={value}>
            <View style={[styles.border, { borderWidth: value }]} />
          </Measure>
        ))}
      </Section>
      <Section title="opacity">
        {Object.entries(opacity).map(([key, value]) => (
          <Measure key={key} name={`opacity.${key}`} value={value}>
            <View style={[styles.bar, styles.opacityBar, { opacity: value }]} />
          </Measure>
        ))}
      </Section>
      <Section title="gradient">
        {Object.entries(gradient.routeFade).map(([key, value]) => (
          <Measure key={key} name={`gradient.routeFade.${key}`} value={value} />
        ))}
      </Section>
    </Scroll>
  ),
};

export const Tamanhos: Story = {
  render: () => (
    <Scroll>
      {Object.entries(size).map(([key, value]) =>
        typeof value === 'number' ? (
          <Measure key={key} name={`size.${key}`} value={value} />
        ) : (
          Object.entries(value).map(([inner, v]) => <Measure key={`${key}.${inner}`} name={`size.${key}.${inner}`} value={v} />)
        ),
      )}
    </Scroll>
  ),
};

export const Movimento: Story = {
  render: () => (
    <Scroll>
      <Section title="motion (ms)">
        {Object.entries(motion).map(([key, value]) => (
          <Measure key={key} name={`motion.${key}`} value={value} />
        ))}
      </Section>
      <Section title="spring">
        {Object.entries(spring).map(([key, value]) => (
          <Measure key={key} name={`spring.${key}`} value={value} />
        ))}
      </Section>
      <Section title="gesture">
        {Object.entries(gesture).map(([key, value]) => (
          <Measure key={key} name={`gesture.${key}`} value={value} />
        ))}
      </Section>
    </Scroll>
  ),
};

const styles = StyleSheet.create({
  page: { gap: spacing[40], paddingBottom: spacing[40] },
  section: { gap: spacing[12] },
  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  swatch: {
    width: size.iconButton.md,
    height: size.iconButton.md,
    borderRadius: radius.sm,
    borderWidth: borderWidth.hairline,
    borderColor: colors.lineStrong,
  },
  swatchText: { flex: 1 },
  typeRow: { gap: spacing[4], paddingBottom: spacing[16], borderBottomWidth: borderWidth.hairline, borderColor: colors.line },
  measureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[12], minHeight: size.touchTarget },
  measureLabel: { flex: 1 },
  bar: { height: size.dot.md, backgroundColor: colors.cards[0], borderRadius: radius.xs },
  opacityBar: { width: size.iconButton.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[16] },
  radiusItem: { gap: spacing[8], alignItems: 'center' },
  radiusBox: { width: size.stack.peek, height: size.stack.peek, backgroundColor: colors.surfaceRaised },
  border: { width: size.iconButton.md, height: size.iconButton.md, borderColor: colors.text, borderRadius: radius.sm },
});
