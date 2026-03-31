import { PostCard } from '@/components/PostCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { LoadingLogo } from '@/components/ui/LoadingLogo';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, formTextInputStyle, radii, screenPaddingX, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import {
  addPostComment,
  fetchPostById,
  fetchPostComments,
  toggleLike,
  type CommentRow,
} from '@/lib/api';
import type { PostWithAuthor } from '@/types/models';
import { Ionicons } from '@expo/vector-icons';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  type LayoutChangeEvent,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PostDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [footerHeight, setFooterHeight] = useState(200);

  const onFooterLayout = useCallback((e: LayoutChangeEvent) => {
    setFooterHeight(e.nativeEvent.layout.height);
  }, []);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const p = await fetchPostById(id);
    setPost(p);
    setComments(p ? await fetchPostComments(id) : []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function send() {
    if (!user || !id || !body.trim()) return;
    const err = await addPostComment(id, user.id, body);
    if (err) return;
    setBody('');
    setComments(await fetchPostComments(id));
  }

  async function onLike() {
    if (!user || !post) return;
    const next = await toggleLike(post.id, user.id, !!post.liked_by_me);
    setPost({
      ...post,
      liked_by_me: next,
      like_count: Math.max(0, (post.like_count ?? 0) + (next ? 1 : -1)),
    });
  }

  const topBar = (
    <View style={styles.topBar}>
      <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Voltar">
        <Ionicons name="chevron-back" size={28} color={colors.onSurface} />
      </Pressable>
    </View>
  );

  if (loading) {
    return (
      <Screen>
        {topBar}
        <View style={styles.loadingWrap}>
          <LoadingLogo />
        </View>
      </Screen>
    );
  }

  if (!post) {
    return (
      <Screen>
        {topBar}
        <Text style={{ color: colors.onSurfaceVariant, fontFamily: fonts.body }}>Post não encontrado.</Text>
      </Screen>
    );
  }

  /** Folga extra: o rodapé pode crescer com o campo multilinha; evita que o último comentário fique tapado. */
  const listPadBottom = footerHeight + spacing.xl;

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBarWrap}>{topBar}</View>
        <FlatList
          style={styles.flex}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={
            <>
              <PostCard post={post} viewerId={user?.id} onLike={onLike} size="large" />
              <Text style={[styles.h, { fontFamily: fonts.display }]}>Comentários</Text>
            </>
          }
          data={comments}
          keyExtractor={(c) => c.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: listPadBottom }]}
          renderItem={({ item }) => (
            <View style={styles.cRow}>
              <Link href={`/(app)/user/${item.user_id}`} asChild>
                <Pressable accessibilityRole="link">
                  <Text style={[styles.cUser, { fontFamily: fonts.bodySemi }]}>
                    @{item.profile?.username ?? '—'}
                  </Text>
                </Pressable>
              </Link>
              <Text style={[styles.cBody, { fontFamily: fonts.body }]}>{item.body}</Text>
            </View>
          )}
        ListEmptyComponent={
          <Text style={[styles.empty, { fontFamily: fonts.body }]}>Seja o primeiro a comentar.</Text>
        }
      />
      <View
        onLayout={onFooterLayout}
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <TextInput
          placeholder="Comentar…"
          placeholderTextColor={colors.onSurfaceVariant}
          value={body}
          onChangeText={setBody}
          style={[
            formTextInputStyle,
            {
              fontFamily: fonts.body,
              backgroundColor: colors.surfaceHigh,
              maxHeight: 100,
              minHeight: 44,
              alignSelf: 'stretch',
            },
          ]}
          multiline
        />
        <PrimaryButton title="Enviar" onPress={send} disabled={!body.trim()} />
      </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBarWrap: {
    paddingHorizontal: screenPaddingX,
  },
  listContent: {
    paddingHorizontal: screenPaddingX,
    flexGrow: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xl },
  h: { fontSize: 18, color: colors.onSurface, marginTop: spacing.lg, marginBottom: spacing.sm },
  cRow: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cUser: { color: colors.primary, marginBottom: 4, fontSize: 13 },
  cBody: { color: colors.onSurface, lineHeight: 20 },
  empty: { color: colors.onSurfaceVariant },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: screenPaddingX,
    paddingTop: spacing.md,
    backgroundColor: colors.surfaceLowest,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
