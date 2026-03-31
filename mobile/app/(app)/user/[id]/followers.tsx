import { LoadingLogo } from '@/components/ui/LoadingLogo';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, screenPaddingX, spacing } from '@/constants/theme';
import { fetchFollowersProfiles } from '@/lib/api';
import { profileInitials } from '@/lib/format';
import type { Profile } from '@/types/models';
import { Image } from 'expo-image';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

export default function FollowersListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setRows(await fetchFollowersProfiles(id));
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Seguidores', headerShown: true }} />
      <Screen edges={['bottom']} belowNativeHeader>
        {loading ? (
          <View style={styles.center}>
            <LoadingLogo />
          </View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={[styles.empty, { fontFamily: fonts.body }]}>Ninguém segue esta conta ainda.</Text>
            }
            renderItem={({ item }) => {
              const initials = profileInitials(item.display_name, item.username);
              return (
                <Link href={`/(app)/user/${item.id}`} asChild>
                  <Pressable style={styles.row} accessibilityRole="button">
                    {item.avatar_url ? (
                      <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPh]}>
                        <Text style={[styles.avatarTxt, { fontFamily: fonts.bodySemi }]}>{initials}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.name, { fontFamily: fonts.bodySemi }]} numberOfLines={1}>
                        {item.display_name || item.username}
                      </Text>
                      <Text style={[styles.handle, { fontFamily: fonts.body }]}>@{item.username}</Text>
                    </View>
                  </Pressable>
                </Link>
              );
            }}
          />
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  center: { paddingTop: 48, alignItems: 'center' },
  list: { paddingHorizontal: screenPaddingX, paddingBottom: spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bgCardAlt,
    overflow: 'hidden',
  },
  avatarPh: { alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 14, color: colors.accent },
  name: { color: colors.text, fontSize: 15 },
  handle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 32 },
});
