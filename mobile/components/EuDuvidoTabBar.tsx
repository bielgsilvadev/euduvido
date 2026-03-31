import { tabBarBottomInset, tabBarOuterHeight } from '@/constants/tabBar';
import { colors } from '@/constants/theme';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function EuDuvidoTabBar(props: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = tabBarBottomInset(insets.bottom);
  const outerH = tabBarOuterHeight(insets.bottom);
  const mergedInsets = { ...props.insets, bottom: bottomPad };

  return (
    <View style={styles.wrap}>
      <BottomTabBar
        {...props}
        insets={mergedInsets}
        style={[{ height: outerH, overflow: 'visible' }]}
      />
    </View>
  );
}

/** @deprecated use EuDuvidoTabBar */
export const DryLeagueTabBar = EuDuvidoTabBar;

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    overflow: 'visible',
  },
});
