import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

function alertFallback(title: string, message: string, buttons?: { text: string; onPress?: () => void }[]): void {
  if (buttons?.length) {
    Alert.alert(title, message, buttons.map((b) => ({ text: b.text, onPress: b.onPress })));
  } else {
    Alert.alert(title, message);
  }
}

export function notifyError(message: string, title = 'Erro'): void {
  alertFallback(title, message);
}

export function notifyInfo(message: string, title = 'Info', onDismiss?: () => void): void {
  if (onDismiss) {
    alertFallback(title, message, [{ text: 'OK', onPress: onDismiss }]);
  } else {
    alertFallback(title, message);
  }
}

/** Nativo: toast in-app (react-native-toast-message), sem diálogo de sistema. */
export function notifySuccess(message: string, title = 'Sucesso', onAfter?: () => void): void {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    visibilityTime: 4000,
  });
  queueMicrotask(() => onAfter?.());
}
