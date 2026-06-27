import { createRoot } from 'react-dom/client';
import AlertModal from '../components/AlertModal';

export function showAlert(options) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);

  return new Promise((resolve) => {
    const handleClose = (result, v) => {
      resolve({confirmed: result, value: v});
      setTimeout(() => {
        root.unmount();
        // Tunda penghapusan container hingga setelah React selesai meng-unmount,
        // agar tidak bentrok dengan commit/cleanup root utama (removeChild error).
        queueMicrotask(() => {
          try {
            if (container.parentNode) container.parentNode.removeChild(container);
          } catch {
            // node sudah dilepas oleh React — abaikan
          }
        });
      }, 300);
    };

    root.render(<AlertModal {...options} onClose={handleClose} portalContainer={container} />);
  });
}
