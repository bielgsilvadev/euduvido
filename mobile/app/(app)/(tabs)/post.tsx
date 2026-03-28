import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { createWorkoutPost, fetchUserLeagues } from '@/lib/api';
import { uploadWorkoutPhoto } from '@/lib/uploadWorkoutPhoto';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function PostWorkoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'global' | 'followers' | 'league_only'>('global');
  const [leagueId, setLeagueId] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) fetchUserLeagues(user.id).then(setLeagues);
  }, [user?.id]);

  const pickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão', 'Precisamos acessar suas fotos para validar o treino.');
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
      Alert.alert('Permissão', 'Precisamos da câmera para registrar o treino.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!res.canceled && res.assets[0]) setImageUri(res.assets[0].uri);
  }, []);

  async function submit() {
    if (!user) return;
    if (!imageUri) {
      Alert.alert('Foto obrigatória', 'Envie uma foto real do treino para validar o post.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Descrição obrigatória', 'Descreva o treino (ex.: Leg day — agachamento, leg press).');
      return;
    }
    if (visibility === 'league_only' && !leagueId) {
      Alert.alert('Liga', 'Selecione uma liga para publicar apenas nela.');
      return;
    }
    setLoading(true);
    const url = await uploadWorkoutPhoto(user.id, imageUri);
    if (!url) {
      setLoading(false);
      Alert.alert('Upload', 'Não foi possível enviar a imagem. Verifique o bucket no Supabase.');
      return;
    }
    const workout_date = format(new Date(), 'yyyy-MM-dd');
    const err = await createWorkoutPost(user.id, {
      image_url: url,
      description: description.trim(),
      workout_date,
      visibility,
      league_id: visibility === 'league_only' ? leagueId : null,
    });
    setLoading(false);
    if (err) {
      Alert.alert('Erro', err);
      return;
    }
    setImageUri(null);
    setDescription('');
    Alert.alert('Treino registrado', '+1 ponto aplicado após validação no servidor.', [
      { text: 'OK', onPress: () => router.push('/(app)/(tabs)/feed') },
    ]);
  }

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { fontFamily: fonts.display }]}>REGISTRAR TREINO</Text>
        <Text style={[styles.hint, { fontFamily: fonts.body }]}>
          Foto real + descrição. Sem isso o treino não conta.
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

        <Text style={[styles.label, { fontFamily: fonts.bodySemi }]} nativeID="desc-label">
          Descrição do treino
        </Text>
        <TextInput
          accessibilityLabelledBy="desc-label"
          placeholder="Ex.: Costas — barra fixa, remada curvada"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          style={[styles.input, { fontFamily: fonts.body }]}
        />

        <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Visibilidade</Text>
        <View style={styles.chips}>
          {(
            [
              ['global', 'Global'],
              ['followers', 'Seguidores'],
              ['league_only', 'Liga'],
            ] as const
          ).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setVisibility(key)}
              style={[styles.chip, visibility === key && styles.chipOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: visibility === key }}>
              <Text
                style={[
                  styles.chipTxt,
                  { fontFamily: fonts.bodySemi },
                  visibility === key && styles.chipTxtOn,
                ]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {visibility === 'league_only' ? (
          <View style={{ marginTop: spacing.md }}>
            <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Sua liga</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {leagues.map((l) => (
                <Pressable
                  key={l.id}
                  onPress={() => setLeagueId(l.id)}
                  style={[styles.chip, leagueId === l.id && styles.chipOn]}>
                  <Text
                    style={[
                      styles.chipTxt,
                      { fontFamily: fonts.bodySemi },
                      leagueId === l.id && styles.chipTxtOn,
                    ]}>
                    {l.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            {!leagues.length ? (
              <Text style={{ color: colors.textMuted, fontFamily: fonts.body, marginTop: 8 }}>
                Entre numa liga antes de publicar só para ela.
              </Text>
            ) : null}
          </View>
        ) : null}

        <PrimaryButton title="Publicar treino" onPress={submit} loading={loading} style={{ marginTop: spacing.xl }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, color: colors.text, letterSpacing: 0.5 },
  hint: { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.md },
  imgRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  mediaBtn: {
    flex: 1,
    backgroundColor: colors.bgCardAlt,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mediaTxt: { color: colors.text },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radii.lg,
    backgroundColor: colors.bgCardAlt,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewPh: { alignItems: 'center', justifyContent: 'center' },
  phText: { color: colors.textMuted },
  label: { color: colors.text, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.bgCardAlt,
    borderRadius: radii.md,
    padding: 14,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.bgCardAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.accentGlow, borderColor: colors.accentDim },
  chipTxt: { color: colors.textMuted, fontSize: 13 },
  chipTxtOn: { color: colors.accent },
});
