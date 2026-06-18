import { useEffect } from 'react';

export function useModalEscape(pairs) {
  const anyOpen = pairs.some(([isOpen]) => isOpen);

  useEffect(() => {
    if (!anyOpen) return;
    function handleKeyDown(e) {
      if (e.key !== 'Escape') return;
      const openPair = pairs.find(([isOpen]) => isOpen);
      if (openPair) openPair[1](false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });
}
