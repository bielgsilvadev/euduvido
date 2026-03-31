import { colors } from '@/constants/theme';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';

type Props = {
  children: string;
  fontSize?: number;
  fontFamily?: string;
  style?: TextStyle;
  containerStyle?: ViewStyle;
};

/**
 * Texto com gradiente (protótipo .gradient-text: lime → verde).
 * O texto duplicado com opacity 0 dimensiona o gradiente de forma fiável.
 */
export function GradientText({
  children,
  fontSize = 32,
  fontFamily,
  style,
  containerStyle,
}: Props) {
  const textStyle: TextStyle = {
    fontSize,
    fontFamily: fontFamily ?? undefined,
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 0.5,
    ...style,
  };

  /* No web o MaskedView costuma falhar e o texto da máscara (#000) fica visível. */
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.maskWrap, containerStyle]}>
        <Text style={[textStyle, styles.webPoints]} selectable={false}>
          {children}
        </Text>
      </View>
    );
  }

  return (
    <MaskedView
      style={[styles.maskWrap, containerStyle]}
      maskElement={
        <Text style={[textStyle, styles.maskText]} selectable={false}>
          {children}
        </Text>
      }>
      <LinearGradient
        colors={[colors.accent, '#7FE832']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.grad}>
        <Text style={[textStyle, styles.sizeRef]} selectable={false}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  maskWrap: { alignSelf: 'center' },
  webPoints: { color: colors.accent },
  maskText: { color: '#000', backgroundColor: 'transparent' },
  grad: { flexDirection: 'row', alignSelf: 'center' },
  sizeRef: { opacity: 0 },
});
