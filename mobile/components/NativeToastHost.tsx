import { colors, fonts } from '@/constants/theme';
import Toast, { BaseToast, type ToastConfig } from 'react-native-toast-message';

const config: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: colors.primary,
        backgroundColor: colors.surfaceHigh,
        borderLeftWidth: 4,
        height: undefined,
        minHeight: 64,
        paddingVertical: 10,
      }}
      text1NumberOfLines={2}
      text2NumberOfLines={4}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: colors.onSurface,
        fontFamily: fonts.bodySemi,
      }}
      text2Style={{
        fontSize: 14,
        color: colors.onSurfaceVariant,
        fontFamily: fonts.body,
      }}
    />
  ),
};

/** iOS/Android (ficheiro .tsx; na web usa-se `NativeToastHost.web.tsx`). */
export function NativeToastHost() {
  return <Toast config={config} position="top" topOffset={52} />;
}
