import { colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function DryLeagueTabBar(props: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomPad = Math.max(insets.bottom, 12);
  const tabBarContentHeight = 52;
  const tabH = tabBarContentHeight + bottomPad;

  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.wine, { bottom: tabH + 8 }]}
        onPress={() => router.push('/(app)/settings')}
        accessibilityLabel="Registrar consumo de álcool"
        accessibilityRole="button">
        <MaterialCommunityIcons name="glass-wine" size={20} color={colors.red} />
      </Pressable>
      <BottomTabBar {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  wine: {
    position: 'absolute',
    right: 20,
    zIndex: 50,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.redDim,
    borderWidth: 1,
    borderColor: 'rgba(255,77,77,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
