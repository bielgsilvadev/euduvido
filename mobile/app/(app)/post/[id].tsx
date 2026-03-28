import { PostCard } from '@/components/PostCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import {
  addPostComment,
  fetchPostById,
  fetchPostComments,
  toggleLike,
  type CommentRow,
} from '@/lib/api';
import type { PostWithAuthor } from '@/types/models';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PostDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [body, setBody] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const p = await fetchPostById(id);
    setPost(p);
    setComments(await fetchPostComments(id));
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

  if (!post) {
    return (
      <Screen>
        <Text style={{ color: colors.onSurfaceVariant, fontFamily: fonts.body }}>Post não encontrado.</Text>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlatList
        style={{ flex: 1 }}
        ListHeaderComponent={
          <>
            <View style={{ paddingHorizontal: spacing.md }}>
              <PostCard post={post} onLike={onLike} />
            </View>
            <Text style={[styles.h, { fontFamily: fonts.display }]}>Comentários</Text>
          </>
        }
        data={comments}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <View style={styles.cRow}>
            <Text style={[styles.cUser, { fontFamily: fonts.bodySemi }]}>
              @{item.profile?.username ?? '—'}
            </Text>
            <Text style={[styles.cBody, { fontFamily: fonts.body }]}>{item.body}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { fontFamily: fonts.body }]}>Seja o primeiro a comentar.</Text>
        }
      />
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <TextInput
          placeholder="Comentar…"
          placeholderTextColor={colors.onSurfaceVariant}
          value={body}
          onChangeText={setBody}
          style={[styles.input, { fontFamily: fonts.body }]}
          multiline
        />
        <PrimaryButton title="Enviar" onPress={send} disabled={!body.trim()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    padding: spacing.md,
    backgroundColor: colors.surfaceLowest,
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.onSurface,
    maxHeight: 100,
  },
});
