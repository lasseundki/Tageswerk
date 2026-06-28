import { useEffect } from 'react';

interface Props {
  message: string;
  onDismiss: () => void;
}

export default function Toast({ message, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  return (
    <div className="toast" onClick={onDismiss} role="status" aria-live="polite">
      <span className="toast-dot" />
      <p className="toast-message">{message}</p>
    </div>
  );
}
