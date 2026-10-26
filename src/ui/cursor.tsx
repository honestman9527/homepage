import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../preferences/index.ts';
import './cursor.css';

const INTERACTIVE_SELECTOR =
  'button:not(.window-resize), a, label, select, [role="menuitem"], [role="button"], [data-dock-app], [data-dock-search]';
const TEXT_SELECTOR =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea';
const GRAB_SELECTOR = '.window-titlebar:not(.single-window .window-titlebar)';

export function CustomCursor() {
  const reducedMotion = useReducedMotion();
  const layerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const ring = ringRef.current;
    const glow = glowRef.current;
    if (!layer || !ring || !glow || reducedMotion) return;

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        layer.dataset.cursorVisible = 'false';
        return;
      }
      const x = event.clientX;
      const y = event.clientY;
      ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      layer.dataset.cursorVisible = 'true';

      const target = event.target instanceof Element ? event.target : null;
      if (!target) {
        layer.dataset.cursorMode = 'default';
        return;
      }
      if (target.closest(TEXT_SELECTOR)) {
        layer.dataset.cursorMode = 'text';
      } else if (target.closest(INTERACTIVE_SELECTOR)) {
        layer.dataset.cursorMode = 'interactive';
      } else if (target.closest(GRAB_SELECTOR)) {
        layer.dataset.cursorMode = 'grab';
      } else {
        layer.dataset.cursorMode = 'default';
      }
    };

    const handleDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      layer.dataset.cursorPressed = 'true';
    };

    const handleUp = () => {
      layer.dataset.cursorPressed = 'false';
    };

    const handleLeave = () => {
      layer.dataset.cursorVisible = 'false';
      layer.dataset.cursorPressed = 'false';
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('pointerdown', handleDown, { passive: true });
    window.addEventListener('pointerup', handleUp, { passive: true });
    window.addEventListener('pointercancel', handleUp, { passive: true });
    document.addEventListener('mouseleave', handleLeave);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      document.removeEventListener('mouseleave', handleLeave);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <div
      ref={layerRef}
      className="desktop-cursor-layer"
      data-cursor-visible="false"
      data-cursor-mode="default"
      data-cursor-pressed="false"
      aria-hidden="true"
    >
      <span ref={glowRef} className="desktop-cursor-glow" />
      <span ref={ringRef} className="desktop-cursor-ring" />
    </div>
  );
}
