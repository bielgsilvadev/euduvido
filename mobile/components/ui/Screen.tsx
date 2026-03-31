import { colors, contentTopPadding, screenPaddingX, stackHeaderContentGap } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  style?: ViewStyle;
  padded?: boolean;
  /** Quando o ecrã usa header nativo do Stack: afasta o conteúdo da barra fixa. */
  belowNativeHeader?: boolean;
};

export function Screen({
  children,
  edges = ['top', 'bottom'],
  style,
  padded = true,
  belowNativeHeader = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const useTop = edges.includes('top');
  const safeEdges = edges.filter((e): e is 'bottom' | 'left' | 'right' => e !== 'top');

  return (
    <SafeAreaView style={[styles.root, style]} edges={safeEdges}>
      <StatusBar style="light" />
      <View
        style={[
          styles.inner,
          padded && styles.padded,
          useTop && { paddingTop: contentTopPadding(insets.top) },
          belowNativeHeader && { paddingTop: stackHeaderContentGap },
        ]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: screenPaddingX,
  },
});
