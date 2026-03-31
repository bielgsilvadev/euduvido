import { Image } from 'expo-image';
import { StyleSheet, View, type ViewStyle } from 'react-native';

type Props = {
  /** Largura máxima do logo (proporção mantida). */
  maxWidth?: number;
  style?: ViewStyle;
};

/**
 * Logo oficial (PNG transparente) — ficheiro em `assets/images/logo.png`.
 * Para trocar a arte: substitui esse ficheiro (e a cópia em `web/public/logo.png`).
 */
export function BrandLogo({ maxWidth = 300, style }: Props) {
  return (
    <View
      style={[styles.wrap, { maxWidth }, style]}
      accessibilityRole="image"
      accessibilityLabel="Eu Duvido!">
      <Image
        source={require('@/assets/images/logo.png')}
        style={styles.img}
        contentFit="contain"
        contentPosition="center"
        transition={200}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignSelf: 'center',
  },
  img: {
    width: '100%',
    aspectRatio: 3.35,
  },
});
