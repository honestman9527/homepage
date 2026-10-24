import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type ComponentProps,
  type RefObject,
} from 'react';

import { GlassMaterial } from './glass-material.tsx';
import { useReducedMotion } from '../preferences/index.ts';
import { usePopoverMotion } from './motion.ts';

const PopoverContext = createContext<{
  active: string | null;
  show(id: string): void;
  dismiss(): void;
} | null>(null);

export function DesktopPopoverProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<string | null>(null);
  const dismiss = useCallback(() => setActive(null), []);
  const value = useMemo(() => ({ active, show: setActive, dismiss }), [active, dismiss]);
  return <PopoverContext value={value}>{children}</PopoverContext>;
}

export function useDesktopPopover() {
  const value = useContext(PopoverContext);
  if (!value) throw new Error('DesktopPopover requires DesktopPopoverProvider');
  return value;
}

/** Nonmodal desktop surface. Launch actions close without restoring trigger focus. */
export function DesktopPopover({
  label,
  trigger,
  children,
  role = 'dialog',
  align = 'end',
  className = '',
}: {
  label: string;
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
  role?: 'menu' | 'dialog';
  align?: 'start' | 'end';
  className?: string;
}) {
  const id = useId();
  const { active, show, dismiss } = useDesktopPopover();
  const open = active === id;
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  function restore() {
    dismiss();
    button.current?.focus({ preventScroll: true });
  }
  useLayoutEffect(() => {
    if (open) {
      const first = panel.current?.querySelector<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]',
      );
      (first ?? panel.current)?.focus({ preventScroll: true });
    }
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) dismiss();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
    };
  }, [open, dismiss]);
  return (
    <div
      className={`desktop-popover ${className}`}
      ref={root}
      data-align={align}
      onKeyDown={(event) => {
        if (open && event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          restore();
        }
      }}
    >
      <button
        ref={button}
        type="button"
        className="status-button"
        aria-label={label}
        aria-haspopup={role}
        aria-expanded={open}
        aria-controls={open ? `${id}-panel` : undefined}
        onClick={() => (open ? restore() : show(id))}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            show(id);
          }
        }}
      >
        {trigger}
      </button>
      {open && (
        <PopoverPanel
          ref={panel}
          id={`${id}-panel`}
          className="desktop-popover-panel"
          role={role}
          aria-label={label}
          tabIndex={-1}
          onKeyDown={(event) => {
            if (role !== 'menu') return;
            const items = Array.from(
              panel.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ??
                [],
            );
            const current = items.indexOf(document.activeElement as HTMLElement);
            const next =
              event.key === 'ArrowDown'
                ? (current + 1) % items.length
                : event.key === 'ArrowUp'
                  ? (current - 1 + items.length) % items.length
                  : event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? items.length - 1
                      : null;
            if (next !== null) {
              event.preventDefault();
              items[next]?.focus();
            }
          }}
        >
          <GlassMaterial />
          {children(dismiss)}
        </PopoverPanel>
      )}
    </div>
  );
}

function PopoverPanel({
  ref,
  ...props
}: ComponentProps<'div'> & { ref: RefObject<HTMLDivElement | null> }) {
  usePopoverMotion(ref, useReducedMotion());
  return <div {...props} ref={ref} />;
}
