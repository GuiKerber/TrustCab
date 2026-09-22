import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { gesture, spacing } from '../theme/tokens';

const FADE = spacing[40];

// Área rolável sem barra de rolagem: um degradê na borda de baixo mostra que há mais conteúdo
// e some quando você chega ao fim.
export function FadeScroll({
  children,
  background,
  style,
  contentContainerStyle,
}: {
  children: ReactNode;
  background: string;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}) {
  const [box, setBox] = useState(0);
  const [content, setContent] = useState(0);
  const [offset, setOffset] = useState(0);
  const more = content - box - offset > 1;

  return (
    <View style={[styles.wrapper, style]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onLayout={(event) => setBox(event.nativeEvent.layout.height)}
        onContentSizeChange={(_, height) => setContent(height)}
        onScroll={(event) => setOffset(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={gesture.scrollThrottle}
        contentContainerStyle={contentContainerStyle}>
        {children}
      </ScrollView>
      {more ? (
        <View style={styles.fade} pointerEvents="none">
          <Svg width="100%" height={FADE}>
            <Defs>
              <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={background} stopOpacity={0} />
                <Stop offset="1" stopColor={background} stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height={FADE} fill="url(#fade)" />
          </Svg>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexShrink: 1, overflow: 'hidden' },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: FADE },
});
