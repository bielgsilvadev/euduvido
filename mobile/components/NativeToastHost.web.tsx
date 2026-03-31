/**
 * Web: não carregar react-native-toast-message (Metro não resolve bem; usa-se react-toastify em AppToasts.web).
 */
export function NativeToastHost() {
  return null;
}
