import { colors } from '@/constants/theme';
import { View } from 'react-native';

/**
 * O separador central da tab bar abre `create-challenge` via `tabPress` em `_layout.tsx`.
 * Este ecrã quase nunca fica visível.
 */
export default function CreateChallengeTabPlaceholder() {
  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}
