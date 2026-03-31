import { LoadingLogo } from '@/components/ui/LoadingLogo';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, formTextInputStyle, screenPaddingX, spacing } from '@/constants/theme';
import { searchProfilesByQuery } from '@/lib/api';
import { profileInitials } from '@/lib/format';
import type { Profile } from '@/types/models';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    setResults(await searchProfilesByQuery(query));
    setLoading(false);
  }, [query]);

  return (
    <Screen edges={['top', 'bottom']} padded={false}>
      <View style={styles.searchRow}>
        <View style={styles.inputWrap}>
          <TextInput
            placeholder="Buscar @usuário ou nome"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={search}
            returnKeyType="search"
            style={[
              formTextInputStyle,
              styles.input,
              { fontFamily: fonts.body, fontSize: 15, backgroundColor: colors.bgCardAlt },
            ]}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <PrimaryButton title="Buscar" onPress={search} loading={loading} style={styles.btn} />
      </View>
      <Text style={[styles.hint, { fontFamily: fonts.body }]}>
        Encontre perfis para desafiar, convidar como árbitro ou acompanhar no feed.
      </Text>
      {loading && !results.length ? (
        <LoadingLogo style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          style={styles.listFlex}
          data={results}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            query.length >= 2 && !loading ? (
              <Text style={[styles.empty, { fontFamily: fonts.body }]}>Nenhum resultado.</Text>
            ) : null
          }
          renderItem={({ item }) => {
            const initials = profileInitials(item.display_name, item.username);
            return (
              <Link href={`/(app)/user/${item.id}`} asChild>
                <Pressable style={styles.row}>
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
                  <Text style={[styles.rep, { fontFamily: fonts.bodySemi }]}>
                    {item.reputation_score != null ? `Rep. ${item.reputation_score}` : `${item.points} pts`}
                  </Text>
                </Pressable>
              </Link>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: screenPaddingX,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
  /** flex:1 + minWidth:0 permite o campo encolher no web; sem isso o botão “Buscar” corta à direita. */
  inputWrap: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  input: {
    width: '100%',
    minHeight: 48,
  },
  btn: {
    flexShrink: 0,
    minWidth: 88,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    paddingHorizontal: screenPaddingX,
    marginBottom: spacing.md,
    lineHeight: 17,
  },
  listFlex: { flex: 1 },
  list: { paddingHorizontal: screenPaddingX, paddingBottom: spacing.xxl, flexGrow: 1 },
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
  rep: { fontSize: 13, color: colors.accent },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 24 },
});
