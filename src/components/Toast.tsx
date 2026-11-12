import { useCallback, useRef, useState, type ReactNode } from 'react';

export function useToast(): { toast: ReactNode; showToast: (message: string) => void } {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const showToast = useCallback((next: string) => {
    setMessage(next);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), 2400);
  }, []);

  const toast = message ? (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-[60] flex justify-center px-6">
      <div className="max-w-[80%] truncate rounded-full bg-ink px-5 py-2.5 text-[13.5px] text-canvas shadow-float animate-toast-in">
        {message}
      </div>
    </div>
  ) : null;

  return { toast, showToast };
}
