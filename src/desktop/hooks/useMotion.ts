import { useEffect, useLayoutEffect, useRef, type RefObject, type PointerEvent } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { Geometry } from '../index.ts';

gsap.registerPlugin(useGSAP);

// A visual copy has no session, listeners or focus targets. Its owner outlives
// the closed frame; completing it can only dispose that exact copy.
const feedback = new WeakMap<Element, Map<string, () => void>>();
function cancelFeedback(owner: Element | null, key?: string) {
  if (!owner) return;
  const entries = feedback.get(owner);
  if (key !== undefined) entries?.get(key)?.();
  else entries?.forEach((dispose) => dispose());
}

function exitFeedback(node: HTMLElement, key: string, vars: gsap.TweenVars) {
  const owner = node.closest('.honestos');
  const rect = node.getBoundingClientRect();
  if (!owner || !rect.width || !rect.height) return;
  cancelFeedback(owner, key);
  const copy = node.cloneNode(true) as HTMLElement;
  const sources = [node, ...node.querySelectorAll<HTMLElement>('*')];
  const copies = [copy, ...copy.querySelectorAll<HTMLElement>('*')];
  // Keep visual state (for example menu roles and today markers); the inert,
  // aria-hidden shell isolates semantics while identities and references are removed.
  copies.forEach((element, index) => {
    for (const attribute of [...element.attributes]) {
      if (
        attribute.name === 'id' ||
        attribute.name === 'for' ||
        /^aria-(activedescendant|controls|describedby|details|errormessage|flowto|labelledby|owns)$/.test(
          attribute.name,
        ) ||
        attribute.name.startsWith('data-')
      )
        element.removeAttribute(attribute.name);
    }
    element.removeAttribute('autofocus');
    element.setAttribute('tabindex', '-1');
    if (element instanceof HTMLInputElement && sources[index] instanceof HTMLInputElement)
      element.value = (sources[index] as HTMLInputElement).value;
  });
  const shell = document.createElement('div');
  shell.setAttribute('aria-hidden', 'true');
  shell.setAttribute('inert', '');
  shell.className = 'motion-feedback';
  Object.assign(shell.style, {
    position: 'fixed',
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    pointerEvents: 'none',
    zIndex: key === 'popover' ? '31' : '25',
  });
  Object.assign(copy.style, {
    position: 'absolute',
    left: '0',
    top: '0',
    margin: '0',
    width: '100%',
    height: '100%',
    transform: 'none',
    opacity: '1',
  });
  for (const [property, value] of Object.entries({
    position: 'absolute',
    left: '0',
    top: '0',
    width: '100%',
    height: '100%',
  }))
    copy.style.setProperty(property, value, 'important');
  shell.append(copy);
  owner.append(shell);
  copies.forEach((element, index) => {
    element.scrollTop = sources[index]!.scrollTop;
    element.scrollLeft = sources[index]!.scrollLeft;
  });
  const entries = feedback.get(owner) ?? new Map<string, () => void>();
  feedback.set(owner, entries);
  let tween: gsap.core.Tween | undefined;
  const dispose = () => {
    tween?.kill();
    shell.remove();
    if (entries.get(key) === dispose) entries.delete(key);
  };
  entries.set(key, dispose);
  tween = gsap.to(shell, { ...vars, onComplete: dispose });
}

function subscribeToInterruptions(settle: () => void) {
  const viewport = window.visualViewport;
  window.addEventListener('resize', settle);
  viewport?.addEventListener('resize', settle);
  viewport?.addEventListener('scroll', settle);
  document.addEventListener('visibilitychange', settle);
  return () => {
    settle();
    window.removeEventListener('resize', settle);
    viewport?.removeEventListener('resize', settle);
    viewport?.removeEventListener('scroll', settle);
    document.removeEventListener('visibilitychange', settle);
  };
}

/** All transient presentation is canceled on environment changes, never flushed as actions. */
export function useDesktopMotion(root: RefObject<HTMLElement | null>, reduced: boolean) {
  useEffect(() => {
    const owner = root.current?.closest('.honestos') ?? null;
    return () => cancelFeedback(owner);
  }, [root]);
  useLayoutEffect(() => {
    const owner = root.current?.closest('.honestos') ?? null;
    const cancel = () => cancelFeedback(owner);
    cancel();
    return subscribeToInterruptions(cancel);
  }, [root, reduced]);
}

function dockOffset(node: HTMLElement) {
  const rect = node.getBoundingClientRect();
  const dock = document
    .querySelector(`[data-dock-app="${node.dataset.appWindow}"]`)
    ?.getBoundingClientRect();
  if (!dock?.width || !dock.height || dock.y > window.innerHeight || dock.y < 0) return null;
  return {
    x: dock.x + dock.width / 2 - rect.x - rect.width / 2,
    y: dock.y + dock.height / 2 - rect.y - rect.height / 2,
  };
}

export function useWindowMotion(
  root: RefObject<HTMLElement | null>,
  {
    visible,
    reduced,
    minimized,
    maximized,
    geometry,
    layout,
  }: {
    visible: boolean;
    reduced: boolean;
    minimized: boolean;
    maximized: boolean;
    geometry: Geometry;
    layout: string;
  },
) {
  const previous = useRef<{ visible: boolean; minimized: boolean } | null>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const geometryFrom = useRef<DOMRect | null>(null);
  const ownsGeometry = useRef(false);
  const finalGeometry = useRef(geometry);
  finalGeometry.current = geometry;
  function cancel() {
    if (!tween.current && !ownsGeometry.current) return;
    tween.current?.kill();
    tween.current = null;
    const node = root.current;
    if (!node) return;
    gsap.set(node, { clearProps: 'transform,opacity' });
    if (ownsGeometry.current) {
      const final = finalGeometry.current;
      Object.assign(node.style, {
        left: `${final.x}px`,
        top: `${final.y}px`,
        width: `${final.width}px`,
        height: `${final.height}px`,
      });
      ownsGeometry.current = false;
    }
  }
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = { visible, minimized };
    const from = geometryFrom.current;
    geometryFrom.current = null;
    cancel();
    const node = root.current;
    if (!node || !visible) return;
    cancelFeedback(node.closest('.honestos'), `window:${node.dataset.appWindow}`);
    if (reduced || !node.getBoundingClientRect().width) return;
    if (from) {
      ownsGeometry.current = true;
      // Interpolate geometry rather than scaling readable app content.
      tween.current = gsap.fromTo(
        node,
        { left: from.x, top: from.y, width: from.width, height: from.height },
        {
          left: geometry.x,
          top: geometry.y,
          width: geometry.width,
          height: geometry.height,
          duration: 0.3,
          ease: 'expo.out',
        },
      );
    } else if (!before || !before.visible) {
      const offset = before?.minimized ? dockOffset(node) : null;
      tween.current = gsap.fromTo(
        node,
        { opacity: 0, scale: offset ? 0.12 : 0.95, x: offset?.x ?? 0, y: offset?.y ?? 14 },
        {
          opacity: 1,
          scale: 1,
          x: 0,
          y: 0,
          duration: offset ? 0.32 : 0.28,
          ease: 'back.out(1.08)',
          clearProps: 'transform,opacity',
        },
      );
    }
    // Cleanup only live presentation: the outgoing copy belongs to the desktop.
    return cancel;
  }, [
    visible,
    reduced,
    minimized,
    maximized,
    layout,
    geometry.x,
    geometry.y,
    geometry.width,
    geometry.height,
  ]);
  useEffect(() => {
    const settle = () => {
      geometryFrom.current = null;
      cancel();
    };
    return subscribeToInterruptions(settle);
  }, []);
  function animateAction(action: () => void, minimize: boolean) {
    const node = root.current;
    cancel();
    if (node && !reduced) {
      const offset = minimize ? dockOffset(node) : null;
      exitFeedback(node, `window:${node.dataset.appWindow}`, {
        opacity: 0,
        scale: offset ? 0.12 : 0.96,
        x: offset?.x ?? 0,
        y: offset?.y ?? 10,
        duration: minimize ? 0.28 : 0.18,
        ease: 'power2.in',
      });
    }
    action();
  }
  function animateGeometry(action: () => void) {
    // Capture the current presentation before settling an interrupted transition.
    const from = root.current?.getBoundingClientRect();
    cancel();
    geometryFrom.current = !reduced && from?.width ? from : null;
    action();
  }
  return { animateAction, animateGeometry, cancel };
}

export function usePopoverMotion(root: RefObject<HTMLElement | null>, reduced: boolean) {
  const latestReduction = useRef(reduced);
  latestReduction.current = reduced;
  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return;
    const owner = node.closest('.honestos');
    cancelFeedback(owner, 'popover');
    if (reduced) return;
    const entrance = node.getBoundingClientRect().width
      ? gsap.fromTo(
          node,
          { opacity: 0, y: -6, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.2,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
          },
        )
      : null;
    const settle = () => {
      entrance?.kill();
      if (entrance) gsap.set(node, { clearProps: 'transform,opacity' });
    };
    const unsubscribe = subscribeToInterruptions(settle);
    return () => {
      unsubscribe();
      if (!latestReduction.current && node.isConnected)
        exitFeedback(node, 'popover', {
          opacity: 0,
          y: -4,
          scale: 0.98,
          duration: 0.12,
          ease: 'power2.in',
        });
    };
  }, [reduced]);
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
          scale: gsap.quickTo(icon, 'scale', { duration: 0.22, ease: 'power3.out' }),
          y: gsap.quickTo(icon, 'y', { duration: 0.22, ease: 'power3.out' }),
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
      const ratio = Math.min(1, distance / 110);
      // Smooth cosine bell curve within the 18% scale / 5px lift spec budget
      const strength = Math.cos(ratio * (Math.PI / 2));
      control.scale(1 + strength * 0.18);
      control.y(-strength * 5);
    });
  }
  function bounce(button: HTMLElement) {
    if (reduced || !window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return;
    if (!button.getBoundingClientRect().width) return;
    gsap.fromTo(
      button,
      { y: 0 },
      {
        y: -5,
        duration: 0.14,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
        overwrite: 'auto',
      },
    );
  }
  return { move, restore, bounce };
}
