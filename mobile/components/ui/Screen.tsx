import { colors, spacing } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  style?: ViewStyle;
  padded?: boolean;
};

export function Screen({ children, edges = ['top', 'bottom'], style, padded = true }: Props) {
  return (
    <SafeAreaView style={[styles.root, style]} edges={edges}>
      <StatusBar style="light" />
      <View style={[styles.inner, padded && styles.padded]}>{children}</View>
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
    paddingHorizontal: spacing.md,
  },
});
