import { toast, type ToastOptions } from 'react-toastify';

const preLine: ToastOptions = {
  position: 'top-center',
  style: { whiteSpace: 'pre-line' },
};

export function notifyError(message: string, title = 'Erro'): void {
  const text = title && title !== 'Erro' ? `${title}\n\n${message}` : message;
  toast.error(text, {
    ...preLine,
    autoClose: 14_000,
  });
}

export function notifyInfo(message: string, title = 'Info', onDismiss?: () => void): void {
  const text = title ? `${title}\n\n${message}` : message;
  toast.info(text, {
    ...preLine,
    autoClose: onDismiss ? 7000 : 10_000,
    onClose: onDismiss,
  });
}

/** Sucesso (ex.: liga criada). Sem diálogo de sistema — só react-toastify. */
export function notifySuccess(message: string, title = 'Sucesso', onAfter?: () => void): void {
  const text = title ? `${title}\n\n${message}` : message;
  toast.success(text, {
    ...preLine,
    autoClose: 4500,
  });
  queueMicrotask(() => onAfter?.());
}
