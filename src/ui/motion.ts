import { useRef, type RefObject, type PointerEvent } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export function useWindowMotion(
  root: RefObject<HTMLElement | null>,
  visible: boolean,
  reduced: boolean,
) {
  const pending = useRef<(() => void) | null>(null);
  const { contextSafe } = useGSAP(
    () => {
      if (reduced && pending.current) {
        const action = pending.current;
        pending.current = null;
        action();
      }
      if (!visible) pending.current = null;
      const node = root.current;
      if (!node || !visible || reduced || !node.getBoundingClientRect().width) return;
      gsap.fromTo(
        node,
        { opacity: 0, scale: 0.96, y: 12 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.28,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        },
      );
    },
    { scope: root, dependencies: [visible, reduced], revertOnUpdate: true },
  );
  return contextSafe((action: () => void, minimize: boolean) => {
    const node = root.current;
    if (!node || reduced || !node.getBoundingClientRect().width) {
      action();
      return;
    }
    if (pending.current) return;
    pending.current = action;
    const rect = node.getBoundingClientRect();
    const dock = document
      .querySelector(`[data-dock-app="${node.dataset.appWindow}"]`)
      ?.getBoundingClientRect();
    gsap.to(node, {
      opacity: 0,
      scale: minimize ? 0.14 : 0.96,
      x: minimize && dock ? dock.x + dock.width / 2 - rect.x - rect.width / 2 : 0,
      y: minimize && dock ? dock.y - rect.y - rect.height / 2 : 8,
      duration: minimize ? 0.3 : 0.16,
      ease: 'power2.in',
      overwrite: true,
      onComplete: () => {
        const finish = pending.current;
        pending.current = null;
        gsap.set(node, { clearProps: 'transform,opacity' });
        finish?.();
      },
    });
  });
}

export function useDockMotion(root: RefObject<HTMLElement | null>, reduced: boolean) {
  const controls = useRef<{ slot: HTMLElement; scale: gsap.QuickToFunc; y: gsap.QuickToFunc }[]>(
    [],
  );
  useGSAP(
    () => {
      controls.current = [];
      if (reduced) return;
      root.current?.querySelectorAll<HTMLElement>('.app-icon').forEach((icon) => {
        controls.current.push({
          slot: icon.parentElement!,
          scale: gsap.quickTo(icon, 'scale', { duration: 0.2, ease: 'power2.out' }),
          y: gsap.quickTo(icon, 'y', { duration: 0.2, ease: 'power2.out' }),
        });
      });
      return () => {
        controls.current = [];
      };
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  );
  function restore() {
    controls.current.forEach((control) => {
      control.scale(1);
      control.y(0);
    });
  }
  function move(event: PointerEvent<HTMLElement>) {
    if (reduced || event.pointerType === 'touch') return;
    controls.current.forEach((control) => {
      const rect = control.slot.getBoundingClientRect();
      const distance = Math.abs(event.clientX - rect.x - rect.width / 2);
      const strength = Math.max(0, 1 - distance / 100);
      control.scale(1 + strength * 0.24);
      control.y(-strength * 7);
    });
  }
  return { move, restore };
}
