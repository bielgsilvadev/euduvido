import { DryLeagueTabBar } from '@/components/DryLeagueTabBar';
import { colors, fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
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
  return (
    <Tabs
      tabBar={(props: BottomTabBarProps) => <DryLeagueTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(10,10,11,0.98)',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,10,11,0.98)' }]} />
          ),
      }}>
      <Tabs.Screen
        name="feed"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} title="Início" showDot />,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leagues"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} title="Ligas" showDot />,
          tabBarIcon: ({ color, size }) => <Ionicons name="trophy-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} title="Treinar" showDot={false} />,
          tabBarIcon: ({ focused }) => (
            <View style={[styles.postCircle, focused && styles.postCircleOn]}>
              <Ionicons name="add" size={28} color={focused ? '#000' : colors.accent} />
            </View>
          ),
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
    minHeight: 30,
    justifyContent: 'flex-start',
  },
  labelText: {
    fontSize: 10,
    fontWeight: '500',
  },
  labelActive: { color: colors.accent },
  labelInactive: { color: colors.textMuted },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginTop: 4,
  },
  dotSpacer: { height: 8, marginTop: 4 },
  postCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bgCardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  postCircleOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});
