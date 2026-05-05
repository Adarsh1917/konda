import { useEffect } from 'react';
import { Shortcut } from '../types';

export function useShortcuts(shortcuts: Shortcut[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Exception: allow certain combinations even in inputs if needed
        // but generally we want to avoid breaking typing
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrlKey === (event.ctrlKey || event.metaKey); // On Mac meta is often used as ctrl
        const shiftMatch = !!shortcut.shiftKey === event.shiftKey;
        const altMatch = !!shortcut.altKey === event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}
