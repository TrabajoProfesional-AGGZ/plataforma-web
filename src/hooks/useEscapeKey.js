import { useEffect } from 'react';

export function useEscapeKey(callback) {
  useEffect(() => {
    function handle(e) { if (e.key === 'Escape') callback(); }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [callback]);
}
