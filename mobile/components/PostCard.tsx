import { Pill } from '@/components/ui/Pill';
import { colors, fonts, radii, spacing, tintForId } from '@/constants/theme';
import type { PostWithAuthor } from '@/types/models';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { workoutCategoryLabel, profileInitials, timeAgo } from '@/lib/format';
import { isFollowing, toggleFollow } from '@/lib/api';
import { Link } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  post: PostWithAuthor;
  viewerId?: string;
  onLike?: () => void;
  compact?: boolean;
};

export function PostCard({ post, viewerId, onLike, compact }: Props) {
  const author = post.author;
  const name = author?.display_name || author?.username || 'Atleta';
  const handle = author?.username ?? '—';
  const tint = tintForId(post.id);
  const category = workoutCategoryLabel(post.description);
  const [following, setFollowing] = useState(false);
  const isSelf = viewerId != null && viewerId === post.user_id;

  useEffect(() => {
    if (!viewerId || isSelf) return;
    isFollowing(viewerId, post.user_id).then(setFollowing);
  }, [viewerId, post.user_id, isSelf]);

  const onFollow = useCallback(async () => {
    if (!viewerId || isSelf) return;
    await toggleFollow(viewerId, post.user_id, following);
    setFollowing(!following);
  }, [viewerId, post.user_id, following, isSelf]);

  const initials = author
    ? profileInitials(author.display_name, author.username)
    : '?';

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Link href={`/(app)/post/${post.id}`} asChild>
        <Pressable accessibilityRole="button" accessibilityLabel="Abrir treino">
          <View style={[styles.hero, { backgroundColor: tint }]}>
            <Image source={{ uri: post.image_url }} style={styles.heroImg} contentFit="cover" />
            <View style={styles.heroOverlay} />
            <View style={styles.pillTopRight}>
              <Pill variant="accent">+1 pt</Pill>
            </View>
            <View style={styles.pillBottomLeft}>
              <Pill variant="muted">{category}</Pill>
            </View>
          </View>
        </Pressable>
      </Link>

      <View style={styles.body}>
        <View style={styles.authorRow}>
          <Link href={`/(app)/user/${post.user_id}`} asChild>
            <Pressable style={styles.avatarWrap} accessibilityLabel={`Perfil de ${name}`}>
              {author?.avatar_url ? (
                <Image source={{ uri: author.avatar_url }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarPh, { backgroundColor: colors.accentGlow }]}>
                  <Text style={[styles.avatarTxt, { fontFamily: fonts.bodySemi, color: colors.accent }]}>
                    {initials}
                  </Text>
                </View>
              )}
            </Pressable>
          </Link>
          <View style={{ flex: 1 }}>
            <Text style={[styles.authorName, { fontFamily: fonts.bodySemi }]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[styles.meta, { fontFamily: fonts.body }]} numberOfLines={1}>
              {timeAgo(post.created_at)}
            </Text>
          </View>
          {!isSelf && viewerId ? (
            <Pressable
              onPress={onFollow}
              style={styles.followGhost}
              accessibilityRole="button"
              accessibilityLabel={following ? 'Deixar de seguir' : 'Seguir'}>
              <Text style={[styles.followTxt, { fontFamily: fonts.bodySemi }]}>
                {following ? 'Seguindo' : 'Seguir'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {!compact ? (
          <Text style={[styles.desc, { fontFamily: fonts.body }]} numberOfLines={6}>
            {post.description}
          </Text>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.actions}>
          <Pressable
            onPress={onLike}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={post.liked_by_me ? 'Descurtir' : 'Curtir'}
            style={styles.actionBtn}>
            <Ionicons
              name={post.liked_by_me ? 'heart' : 'heart-outline'}
              size={18}
              color={post.liked_by_me ? colors.red : colors.textMuted}
            />
            <Text
              style={[
                styles.actionCount,
                { fontFamily: fonts.body },
                post.liked_by_me && { color: colors.red },
              ]}>
              {post.like_count ?? 0}
            </Text>
          </Pressable>
          <Link href={`/(app)/post/${post.id}`} asChild>
            <Pressable accessibilityRole="link" style={styles.actionBtn} hitSlop={12}>
              <Ionicons name="chatbubble-outline" size={18} color={colors.textMuted} />
              <Text style={[styles.actionCount, { fontFamily: fonts.body }]}>
                {post.comment_count ?? 0}
              </Text>
            </Pressable>
          </Link>
          <View style={{ flex: 1 }} />
          <Pressable accessibilityRole="button" accessibilityLabel="Compartilhar" hitSlop={12}>
            <Ionicons name="share-outline" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    overflow: 'hidden',
  },
  hero: {
    height: 180,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImg: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  pillTopRight: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  pillBottomLeft: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  body: {
    padding: spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatarWrap: {},
  avatarPh: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCardAlt,
  },
  avatarTxt: { fontSize: 12 },
  authorName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  followGhost: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  followTxt: {
    fontSize: 12,
    color: colors.textMuted,
  },
  desc: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 14,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionCount: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
