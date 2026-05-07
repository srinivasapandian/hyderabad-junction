import { useEffect } from 'react';
import './Toast.css';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export default function Toast({ message, visible, onHide, duration = 3500 }: ToastProps): React.JSX.Element {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onHide, duration);
    return () => clearTimeout(timer);
  }, [visible, message, duration, onHide]);

  return (
    <div className={`toast${visible ? ' toast--visible' : ''}`}>
      <i className="fas fa-circle-exclamation toast__icon" />
      <span className="toast__msg">{message}</span>
    </div>
  );
}
