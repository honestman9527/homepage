import { useEffect, useState } from 'react';

export function useLocalClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

/** Visual viewport updates are presentation-only; never dispatch window geometry. */
export function useVisualViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const root = document.documentElement;
    const update = () => {
      root.style.setProperty('--visual-height', `${viewport?.height ?? window.innerHeight}px`);
      root.style.setProperty('--visual-top', `${viewport?.offsetTop ?? 0}px`);
      root.dataset.keyboard = String(!!viewport && viewport.height < window.innerHeight - 100);
    };
    update();
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      root.style.removeProperty('--visual-height');
      root.style.removeProperty('--visual-top');
      delete root.dataset.keyboard;
    };
  }, []);
}
