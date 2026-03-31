import 'react-toastify/dist/ReactToastify.css';

import { ToastContainer } from 'react-toastify';

/**
 * Web: contentor dos toasts (tema escuro Eu Duvido!).
 */
export function AppToasts() {
  return (
    <ToastContainer
      position="top-center"
      theme="dark"
      autoClose={12_000}
      newestOnTop
      limit={5}
      closeOnClick
      pauseOnHover
      draggable={false}
      toastStyle={{
        background: '#111114',
        color: '#F0F0F2',
        border: '1px solid #1E1E24',
        borderRadius: 12,
      }}
    />
  );
}
