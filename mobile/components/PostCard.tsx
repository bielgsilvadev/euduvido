import { Pill } from '@/components/ui/Pill';
import { colors, fonts, radii, spacing, tintForId } from '@/constants/theme';
import type { PostWithAuthor } from '@/types/models';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { profileInitials, timeAgo, workoutCategoryLabel, workoutTypeLabel } from '@/lib/format';
import { isFollowing, toggleFollow, WORKOUT_DESCRIPTION_EMPTY_SENTINEL } from '@/lib/api';
import { Link } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  post: PostWithAuthor;
  viewerId?: string;
  onLike?: () => void;
  compact?: boolean;
  /** Ecrã de detalhe: imagem maior, corpo e tipografia amplidos. */
  size?: 'default' | 'large';
};

export function PostCard({ post, viewerId, onLike, compact, size = 'default' }: Props) {
  const large = size === 'large';
  const author = post.author;
  const name = author?.display_name || author?.username || 'Atleta';
  const handle = author?.username ?? '—';
  const tint = tintForId(post.id);
  const isAlcohol = post.post_kind === 'alcohol';
  const category = isAlcohol
    ? 'Álcool · honestidade'
    : workoutTypeLabel(post.workout_type) ?? workoutCategoryLabel(post.description);
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
    <View style={[styles.card, large && styles.cardLarge]} accessibilityRole="summary">
      <Link href={`/(app)/post/${post.id}`} asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isAlcohol ? 'Abrir registro de álcool' : 'Abrir treino'}>
          <View
            style={[
              styles.hero,
              large && styles.heroLarge,
              { backgroundColor: tint },
              isAlcohol && { borderBottomWidth: 2, borderBottomColor: 'rgba(255,77,77,0.45)' },
            ]}>
            <Image source={{ uri: post.image_url }} style={styles.heroImg} contentFit="cover" />
            <View style={[styles.heroOverlay, isAlcohol && styles.heroOverlayAlcohol]} />
            <View style={styles.pillTopRight}>
              <Pill variant={isAlcohol ? 'red' : 'accent'}>{isAlcohol ? '−15 pts' : '+1 pt'}</Pill>
            </View>
            <View style={styles.pillBottomLeft}>
              <Pill variant="muted">{category}</Pill>
            </View>
          </View>
        </Pressable>
      </Link>

      <View style={[styles.body, large && styles.bodyLarge]}>
        <View style={[styles.authorRow, large && styles.authorRowLarge]}>
          <Link href={`/(app)/user/${post.user_id}`} asChild>
            <Pressable style={styles.avatarWrap} accessibilityLabel={`Perfil de ${name}`}>
              {author?.avatar_url ? (
                <Image
                  source={{ uri: author.avatar_url }}
                  style={[styles.avatarImg, large && styles.avatarImgLarge]}
                />
              ) : (
                <View
                  style={[
                    styles.avatarPh,
                    large && styles.avatarPhLarge,
                    { backgroundColor: colors.accentGlow },
                  ]}>
                  <Text
                    style={[
                      styles.avatarTxt,
                      large && styles.avatarTxtLarge,
                      { fontFamily: fonts.bodySemi, color: colors.accent },
                    ]}>
                    {initials}
                  </Text>
                </View>
              )}
            </Pressable>
          </Link>
          <Link href={`/(app)/user/${post.user_id}`} asChild>
            <Pressable style={{ flex: 1 }} accessibilityRole="link" accessibilityLabel={`Perfil de ${name}`}>
              <Text
                style={[styles.authorName, large && styles.authorNameLarge, { fontFamily: fonts.bodySemi }]}
                numberOfLines={1}>
                {name}
              </Text>
              <Text style={[styles.meta, large && styles.metaLarge, { fontFamily: fonts.body }]} numberOfLines={1}>
                @{handle} · {timeAgo(post.created_at)}
              </Text>
            </Pressable>
          </Link>
          {!isSelf && viewerId ? (
            <Pressable
              onPress={onFollow}
              style={[styles.followGhost, large && styles.followGhostLarge]}
              accessibilityRole="button"
              accessibilityLabel={following ? 'Deixar de seguir' : 'Seguir'}>
              <Text style={[styles.followTxt, large && styles.followTxtLarge, { fontFamily: fonts.bodySemi }]}>
                {following ? 'Seguindo' : 'Seguir'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {!compact &&
        post.description?.trim() &&
        post.description.trim() !== WORKOUT_DESCRIPTION_EMPTY_SENTINEL ? (
          <Text
            style={[styles.desc, large && styles.descLarge, { fontFamily: fonts.body }]}
            numberOfLines={large ? 12 : 6}>
            {post.description.trim()}
          </Text>
        ) : null}

        <View style={[styles.divider, large && styles.dividerLarge]} />

        <View style={styles.actions}>
          <Pressable
            onPress={onLike}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={post.liked_by_me ? 'Descurtir' : 'Curtir'}
            style={styles.actionBtn}>
            <Ionicons
              name={post.liked_by_me ? 'heart' : 'heart-outline'}
              size={large ? 24 : 18}
              color={post.liked_by_me ? colors.red : colors.textMuted}
            />
            <Text
              style={[
                styles.actionCount,
                large && styles.actionCountLarge,
                { fontFamily: fonts.body },
                post.liked_by_me && { color: colors.red },
              ]}>
              {post.like_count ?? 0}
            </Text>
          </Pressable>
          <Link href={`/(app)/post/${post.id}`} asChild>
            <Pressable accessibilityRole="link" style={styles.actionBtn} hitSlop={12}>
              <Ionicons name="chatbubble-outline" size={large ? 24 : 18} color={colors.textMuted} />
              <Text style={[styles.actionCount, large && styles.actionCountLarge, { fontFamily: fonts.body }]}>
                {post.comment_count ?? 0}
              </Text>
            </Pressable>
          </Link>
          <View style={{ flex: 1 }} />
          <Pressable accessibilityRole="button" accessibilityLabel="Compartilhar" hitSlop={12}>
            <Ionicons name="share-outline" size={large ? 24 : 18} color={colors.textMuted} />
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
  /** Largura = 100% do contentor (igual à coluna de comentários); retrato alto para destacar a foto. */
  heroLarge: {
    height: undefined,
    width: '100%',
    minHeight: 320,
    aspectRatio: 3 / 4,
  },
  cardLarge: {
    marginHorizontal: 0,
    marginBottom: spacing.lg,
    borderRadius: radii.xl,
  },
  heroImg: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  heroOverlayAlcohol: {
    backgroundColor: 'rgba(80,20,20,0.35)',
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
  bodyLarge: {
    padding: spacing.lg,
    paddingTop: spacing.md + 2,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  authorRowLarge: {
    gap: 14,
    marginBottom: 16,
  },
  avatarWrap: {},
  avatarPh: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPhLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCardAlt,
  },
  avatarImgLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarTxt: { fontSize: 12 },
  avatarTxtLarge: { fontSize: 15 },
  authorName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  authorNameLarge: {
    fontSize: 17,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  metaLarge: {
    fontSize: 14,
    marginTop: 4,
  },
  followGhost: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  followGhostLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  followTxt: {
    fontSize: 12,
    color: colors.textMuted,
  },
  followTxtLarge: {
    fontSize: 14,
  },
  desc: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  descLarge: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 14,
  },
  dividerLarge: {
    marginBottom: 18,
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
  actionCountLarge: {
    fontSize: 16,
  },
});
