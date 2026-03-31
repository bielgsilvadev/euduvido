import { EuDuvidoTabBar } from '@/components/EuDuvidoTabBar';
import { colors, fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { Href } from 'expo-router';
import { Tabs, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, Text, View } from 'react-native';

function TabLabel({
  focused,
  title,
  showDot,
}: {
  focused: boolean;
  title: string;
  showDot: boolean;
}) {
  return (
    <View style={styles.labelCol}>
      <Text
        style={[
          styles.labelText,
          { fontFamily: fonts.body },
          focused ? styles.labelActive : styles.labelInactive,
        ]}>
        {title}
      </Text>
      {showDot ? (
        focused ? (
          <View style={styles.dot} />
        ) : (
          <View style={styles.dotSpacer} />
        )
      ) : null}
    </View>
  );
}

export default function TabsLayout() {
  const router = useRouter();
  return (
    <Tabs
      tabBar={(props: BottomTabBarProps) => <EuDuvidoTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(10,10,10,0.98)',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          paddingTop: 6,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,10,10,0.98)' }]} />
          ),
      }}>
      <Tabs.Screen
        name="feed"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} title="Feed" showDot />,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} title="Explorar" showDot />,
          tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} title="Desafio" showDot={false} />,
          tabBarIcon: ({ focused }) => (
            <View style={styles.postCircleWrap}>
              <View style={[styles.postCircle, focused && styles.postCircleOn]}>
                <Ionicons name="add" size={26} color={focused ? '#fff' : colors.accent} />
              </View>
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/(app)/create-challenge' as Href);
          },
        }}
      />
      <Tabs.Screen
        name="rank"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} title="Ranking" showDot />,
          tabBarIcon: ({ color, size }) => <Ionicons name="medal-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} title="Perfil" showDot />,
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  labelCol: {
    alignItems: 'center',
    minHeight: 22,
    justifyContent: 'flex-start',
  },
  labelText: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 13,
  },
  labelActive: { color: colors.accent },
  labelInactive: { color: colors.textMuted },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginTop: 2,
  },
  dotSpacer: { height: 6, marginTop: 2 },
  postCircleWrap: {
    transform: [{ translateY: -14 }],
  },
  postCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgCardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postCircleOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});
