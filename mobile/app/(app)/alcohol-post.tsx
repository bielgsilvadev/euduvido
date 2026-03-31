import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { createAlcoholPost, fetchUserLeagues } from '@/lib/api';
import { uploadWorkoutPhoto } from '@/lib/uploadWorkoutPhoto';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type AudienceKey = 'global' | 'followers' | 'league';

const AUDIENCE_OPTIONS: { key: AudienceKey; label: string }[] = [
  { key: 'global', label: 'Global' },
  { key: 'followers', label: 'Seguidores' },
  { key: 'league', label: 'Comunidades' },
];

export default function AlcoholPostScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [descFocused, setDescFocused] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState<Set<AudienceKey>>(() => new Set(['global']));
  const [leagueIds, setLeagueIds] = useState<Set<string>>(() => new Set());
  const [leagues, setLeagues] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) fetchUserLeagues(user.id).then(setLeagues);
  }, [user?.id]);

  const toggleAudience = useCallback((key: AudienceKey) => {
    setAudience((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size <= 1) return prev;
        next.delete(key);
        if (key === 'league') setLeagueIds(new Set());
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleLeague = useCallback((id: string) => {
    setLeagueIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const pickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão', 'Precisamos acessar suas fotos para anexar ao registro.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) setImageUri(res.assets[0].uri);
  }, []);

  const takePhoto = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão', 'Precisamos da câmera para registrar.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!res.canceled && res.assets[0]) setImageUri(res.assets[0].uri);
  }, []);

  async function submit() {
    if (authLoading) {
      Alert.alert('A carregar', 'Aguarda um momento enquanto a sessão fica pronta.');
      return;
    }
    if (!user) {
      Alert.alert(
        'Sessão necessária',
        'Não há utilizador com sessão ativa. Inicia sessão ou configura o Supabase no projeto.',
      );
      return;
    }
    if (!imageUri) {
      Alert.alert('Foto obrigatória', 'Envie uma foto para registrar a ocorrência no feed.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Descrição obrigatória', 'Descreva o contexto (ex.: social, 1 cerveja).');
      return;
    }
    const showLeague = audience.has('league');
    if (showLeague && leagueIds.size === 0) {
      Alert.alert('Liga', 'Seleciona uma ou mais ligas para incluir nos respetivos feeds.');
      return;
    }
    try {
      setLoading(true);
      const url = await uploadWorkoutPhoto(user.id, imageUri);
      if (!url) {
        Alert.alert('Upload', 'Não foi possível enviar a imagem.');
        return;
      }
      const workout_date = format(new Date(), 'yyyy-MM-dd');
      const { error, feedPost } = await createAlcoholPost(user.id, {
        image_url: url,
        description: description.trim(),
        workout_date,
        visible_global: audience.has('global'),
        visible_followers: audience.has('followers'),
        visible_league: showLeague,
        league_ids: showLeague ? [...leagueIds] : null,
      });
      if (error) {
        Alert.alert('Erro', error);
        return;
      }
      setImageUri(null);
      setDescription('');
      setAudience(new Set(['global']));
      setLeagueIds(new Set());
      const msg = feedPost
        ? 'Penalidade de reputação aplicada. O post aparece no feed como registro de transparência.'
        : 'Penalidade registrada (modo legado: sem post no feed).';
      Alert.alert('Registrado', msg, [{ text: 'OK', onPress: () => router.push('/(app)/(tabs)/feed') }]);
    } catch (e) {
      console.error('[Registo álcool]', e);
      Alert.alert(
        'Erro',
        e instanceof Error ? e.message : 'Não foi possível concluir o registo. Tenta de novo.',
      );
    } finally {
      setLoading(false);
    }
  }

  const showLeaguePicker = audience.has('league');

  return (
    <Screen edges={['bottom']} belowNativeHeader>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { fontFamily: fonts.display }]}>REGISTRO DE QUEBRA</Text>
        <Text style={[styles.hint, { fontFamily: fonts.body }]}>
          Publique prova de quebra de aposta ou infração de regra com transparência para a comunidade.
        </Text>

        <View style={styles.imgRow}>
          <Pressable onPress={pickImage} style={styles.mediaBtn} accessibilityLabel="Escolher da galeria">
            <Text style={[styles.mediaTxt, { fontFamily: fonts.bodySemi }]}>Galeria</Text>
          </Pressable>
          <Pressable onPress={takePhoto} style={styles.mediaBtn} accessibilityLabel="Tirar foto">
            <Text style={[styles.mediaTxt, { fontFamily: fonts.bodySemi }]}>Câmera</Text>
          </Pressable>
        </View>

        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" />
        ) : (
          <View style={[styles.preview, styles.previewPh]}>
            <Text style={[styles.phText, { fontFamily: fonts.body }]}>Pré-visualização</Text>
          </View>
        )}

        <Text style={[styles.label, styles.labelAboveField, { fontFamily: fonts.bodySemi }]} nativeID="alc-desc-label">
          Descrição
        </Text>
        <View style={[styles.inputWrap, descFocused && styles.inputWrapFocused]}>
          <TextInput
            accessibilityLabelledBy="alc-desc-label"
            placeholder="Ex.: descumpri regra do desafio no sábado"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            underlineColorAndroid="transparent"
            cursorColor={colors.accent}
            selectionColor={colors.accentDim}
            onFocus={() => setDescFocused(true)}
            onBlur={() => setDescFocused(false)}
            style={[
              styles.inputInner,
              { fontFamily: fonts.body },
              Platform.OS === 'web' && { outlineWidth: 0 },
            ]}
          />
        </View>

        <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Visibilidade</Text>
        <Text style={[styles.visHint, { fontFamily: fonts.body }]}>
          Escolha onde a ocorrência será exibida: feed global, seguidores ou comunidades.
        </Text>
        <View style={styles.chips}>
          {AUDIENCE_OPTIONS.map(({ key, label }) => {
            const on = audience.has(key);
            return (
              <Pressable
                key={key}
                onPress={() => toggleAudience(key)}
                style={[styles.chip, on && styles.chipOn]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}>
                <Text style={[styles.chipTxt, { fontFamily: fonts.bodySemi }, on && styles.chipTxtOn]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {showLeaguePicker ? (
          <View>
            <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Suas comunidades</Text>
            <Text style={[styles.visHint, { fontFamily: fonts.body }]}>
              Você pode marcar várias — o registro entra no feed de cada uma.
            </Text>
            <View style={styles.chips}>
              {leagues.map((l) => {
                const on = leagueIds.has(l.id);
                return (
                  <Pressable
                    key={l.id}
                    onPress={() => toggleLeague(l.id)}
                    style={[styles.chip, on && styles.chipOn]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}>
                    <Text style={[styles.chipTxt, { fontFamily: fonts.bodySemi }, on && styles.chipTxtOn]}>
                      {l.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {!leagues.length ? (
              <Text style={styles.inlineHelp}>Entre em uma comunidade antes de marcar esta audiência.</Text>
            ) : null}
          </View>
        ) : null}

        <PrimaryButton
          title="Publicar registro"
          onPress={() => void submit()}
          loading={loading}
          disabled={authLoading}
          variant="secondary"
          style={styles.submitBtn}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  /** Ritmo 8pt: secções ~24–32px; rótulo→texto de apoio 8px; apoio→controlo 16px; após grupo de chips 32px. */
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: 24,
    color: colors.text,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  imgRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  mediaBtn: {
    flex: 1,
    backgroundColor: colors.bgCardAlt,
    minHeight: 48,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mediaTxt: { color: colors.text },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radii.lg,
    backgroundColor: colors.bgCardAlt,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewPh: { alignItems: 'center', justifyContent: 'center' },
  phText: { color: colors.textMuted },
  label: { color: colors.text, marginBottom: spacing.sm, fontSize: 15 },
  labelAboveField: { marginBottom: spacing.md },
  visHint: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  inputWrap: {
    alignSelf: 'stretch',
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderRadius: radii.md,
    backgroundColor: colors.bgCardAlt,
    minHeight: 100,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  inputWrapFocused: {
    borderColor: colors.accentDim,
    borderWidth: 2,
  },
  inputInner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 100,
    color: colors.text,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 24,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    rowGap: spacing.sm,
    marginBottom: spacing.xl,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.bgCardAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.accentGlow, borderColor: colors.accentDim },
  chipTxt: { color: colors.textMuted, fontSize: 14 },
  chipTxtOn: { color: colors.accent },
  inlineHelp: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  submitBtn: { marginTop: spacing.xxl },
});
