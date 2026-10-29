import type { AndroidSymbol } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { borderWidth, colors, radius, spacing } from '../theme/tokens';

import { Button } from './Button';
import { Text } from './ui';

// Lista vazia.
//
// O contorno tracejado diz que o espaço está vazio de propósito — não é um bloco que falhou ao
// carregar. A ilustração é decorativa e fica escondida do leitor de tela: quem conta a história é
// o texto, que diz o que está faltando e o que fazer para deixar de estar.
//
// Três cinzas só, e nenhuma cor de marca, para o vazio não competir com os cartões de viagem.

export type EmptyArt = 'viagens' | 'passageiros' | 'ganhos' | 'pedidos';

const ART_SIZE = { width: 160, height: 120 };

export function EmptyState({
  art,
  title,
  text,
  action,
}: {
  art: EmptyArt;
  title: string;
  text: string;
  action?: { label: string; icon?: AndroidSymbol; onPress: () => void };
}) {
  return (
    <View style={styles.wrapper}>
      <Illustration art={art} />
      <View style={styles.text}>
        <Text variant="heading" style={styles.center}>
          {title}
        </Text>
        <Text variant="small" tone="secondary" style={styles.center}>
          {text}
        </Text>
      </View>
      {action ? <Button label={action.label} icon={action.icon} size="sm" variant="surface" onPress={action.onPress} /> : null}
    </View>
  );
}

// Os desenhos vêm do design system (nó 61:46). Ficam em código, e não como arquivo .svg, porque é
// assim que o projeto já desenha a ilustração do percurso — e porque importar .svg exigiria somar
// um transformador ao empacotador só por causa de quatro figuras.
function Illustration({ art }: { art: EmptyArt }) {
  return (
    <Svg {...ART_SIZE} viewBox="0 0 160 120" fill="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {art === 'viagens' ? (
        <>
          <Path d="M68 18.5C68 16.0147 65.9853 14 63.5 14C61.0147 14 59 16.0147 59 18.5V33.5C59 35.9853 61.0147 38 63.5 38C65.9853 38 68 35.9853 68 33.5V18.5Z" fill={colors.lineStrong} />
          <Path d="M101 18.5C101 16.0147 98.9853 14 96.5 14C94.0147 14 92 16.0147 92 18.5V33.5C92 35.9853 94.0147 38 96.5 38C98.9853 38 101 35.9853 101 33.5V18.5Z" fill={colors.lineStrong} />
          <Path d="M104 26H56C48.268 26 42 32.268 42 40V82C42 89.732 48.268 96 56 96H104C111.732 96 118 89.732 118 82V40C118 32.268 111.732 26 104 26Z" fill={colors.surfaceRaised} />
          <Path d="M118 44H42V47H118V44Z" fill={colors.lineStrong} />
          <Path d="M62 71C64.7614 71 67 68.7614 67 66C67 63.2386 64.7614 61 62 61C59.2386 61 57 63.2386 57 66C57 68.7614 59.2386 71 62 71Z" fill={colors.lineStrong} />
          <Path d="M80 71C82.7614 71 85 68.7614 85 66C85 63.2386 82.7614 61 80 61C77.2386 61 75 63.2386 75 66C75 68.7614 77.2386 71 80 71Z" fill={colors.lineStrong} />
          <Path d="M98 71C100.761 71 103 68.7614 103 66C103 63.2386 100.761 61 98 61C95.2386 61 93 63.2386 93 66C93 68.7614 95.2386 71 98 71Z" fill={colors.lineStrong} />
          <Path d="M62 87C64.7614 87 67 84.7614 67 82C67 79.2386 64.7614 77 62 77C59.2386 77 57 79.2386 57 82C57 84.7614 59.2386 87 62 87Z" fill={colors.lineStrong} />
          <Path d="M80 87C82.7614 87 85 84.7614 85 82C85 79.2386 82.7614 77 80 77C77.2386 77 75 79.2386 75 82C75 84.7614 77.2386 87 80 87Z" fill={colors.lineStrong} />
        </>
      ) : null}
      {art === 'passageiros' ? (
        <>
          <Path d="M108 70H92C84.268 70 78 76.268 78 84C78 91.732 84.268 98 92 98H108C115.732 98 122 91.732 122 84C122 76.268 115.732 70 108 70Z" fill={colors.lineStrong} />
          <Path d="M100 63C107.18 63 113 57.1797 113 50C113 42.8203 107.18 37 100 37C92.8203 37 87 42.8203 87 50C87 57.1797 92.8203 63 100 63Z" fill={colors.lineStrong} />
          <Path d="M69 64H53C43.6112 64 36 71.6112 36 81C36 90.3888 43.6112 98 53 98H69C78.3888 98 86 90.3888 86 81C86 71.6112 78.3888 64 69 64Z" fill={colors.surfaceRaised} />
          <Path d="M61 59C70.3888 59 78 51.3888 78 42C78 32.6112 70.3888 25 61 25C51.6112 25 44 32.6112 44 42C44 51.3888 51.6112 59 61 59Z" fill={colors.surfaceRaised} />
        </>
      ) : null}
      {art === 'ganhos' ? (
        <>
          <Path d="M106 96C118.15 96 128 86.1503 128 74C128 61.8497 118.15 52 106 52C93.8497 52 84 61.8497 84 74C84 86.1503 93.8497 96 106 96Z" fill={colors.lineStrong} />
          <Path d="M86 20H52C45.3726 20 40 25.3726 40 32V84C40 90.6274 45.3726 96 52 96H86C92.6274 96 98 90.6274 98 84V32C98 25.3726 92.6274 20 86 20Z" fill={colors.surfaceRaised} />
          <Path d="M82 36H56C53.7909 36 52 37.7909 52 40C52 42.2091 53.7909 44 56 44H82C84.2091 44 86 42.2091 86 40C86 37.7909 84.2091 36 82 36Z" fill={colors.lineStrong} />
          <Path d="M72 52H56C53.7909 52 52 53.7909 52 56C52 58.2091 53.7909 60 56 60H72C74.2091 60 76 58.2091 76 56C76 53.7909 74.2091 52 72 52Z" fill={colors.lineStrong} />
        </>
      ) : null}
      {art === 'pedidos' ? (
        <>
          <Path d="M116 26H44C38.4772 26 34 30.4772 34 36V74C34 79.5228 38.4772 84 44 84H116C121.523 84 126 79.5228 126 74V36C126 30.4772 121.523 26 116 26Z" fill={colors.surfaceRaised} />
          <Path d="M38 32L80 62L122 32V43L80 73L38 43V32Z" fill={colors.lineStrong} />
          <Path d="M118 97C127.389 97 135 89.3888 135 80C135 70.6112 127.389 63 118 63C108.611 63 101 70.6112 101 80C101 89.3888 108.611 97 118 97Z" fill={colors.surface} />
          <Path d="M118 91.5C124.351 91.5 129.5 86.3513 129.5 80C129.5 73.6487 124.351 68.5 118 68.5C111.649 68.5 106.5 73.6487 106.5 80C106.5 86.3513 111.649 91.5 118 91.5Z" fill={colors.lineStrong} />
          <Path d="M118 73.5V80.5H124" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" stroke={colors.textSecondary} />
        </>
      ) : null}
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: spacing[20],
    paddingVertical: spacing[40],
    paddingHorizontal: spacing[20],
    borderRadius: radius.card,
    borderWidth: borderWidth.hairline,
    borderColor: colors.line,
    borderStyle: 'dashed',
  },
  text: { alignItems: 'center', gap: spacing[8], width: '100%' },
  center: { textAlign: 'center' },
});
