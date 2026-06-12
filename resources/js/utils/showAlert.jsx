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
        container.remove();
      }, 300);
    };

    root.render(<AlertModal {...options} onClose={handleClose} />);
  });
}
