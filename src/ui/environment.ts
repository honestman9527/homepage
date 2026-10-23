import { useEffect } from 'react';

/** Visual viewport updates are presentation-only; never dispatch window geometry. */
export function useVisualViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const root = document.documentElement;
    const update = (keepInputVisible = false) => {
      const compact = (viewport?.height ?? window.innerHeight) < 360;
      root.style.setProperty('--visual-height', `${viewport?.height ?? window.innerHeight}px`);
      root.style.setProperty('--visual-top', `${viewport?.offsetTop ?? 0}px`);
      root.dataset.keyboard = String(!!viewport && viewport.height < window.innerHeight - 100);
      root.dataset.compactViewport = String(compact);
      const focused = document.activeElement;
      if (compact && keepInputVisible && focused instanceof HTMLElement && focused.matches('[data-terminal-input]') && !focused.closest('[hidden],[inert]')) {
        // CSS has just made the window's scrollport fit the visual viewport. Retain
        // existing input focus and reveal it; never focus a terminal on resize.
        focused.scrollIntoView?.({ block: 'nearest' });
      }
    };
    update();
    const resized = () => update(true);
    const scrolled = () => update();
    viewport?.addEventListener('resize', resized);
    viewport?.addEventListener('scroll', scrolled);
    window.addEventListener('resize', resized);
    return () => {
      viewport?.removeEventListener('resize', resized);
      viewport?.removeEventListener('scroll', scrolled);
      window.removeEventListener('resize', resized);
      root.style.removeProperty('--visual-height');
      root.style.removeProperty('--visual-top');
      delete root.dataset.keyboard;
      delete root.dataset.compactViewport;
    };
  }, []);
}
