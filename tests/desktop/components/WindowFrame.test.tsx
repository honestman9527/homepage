// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { DesktopProvider, useDesktop } from '../../../src/desktop/index.ts';
import { PreferencesProvider } from '../../../src/preferences/index.ts';
import { WindowFrame } from '../../../src/desktop/components/WindowFrame.tsx';

afterEach(cleanup);
function OpenAbout() {
  const desktop = useDesktop();
  return <button onClick={() => desktop.open('about')}>Open About</button>;
}
it('uses a nonmodal window with named controls and retains input focus on content pointerdown', () => {
  render(
    <PreferencesProvider storage={null} motionQuery={null}>
      <DesktopProvider>
        <OpenAbout />
        <WindowFrame appId="about" onClose={() => {}} onMinimize={() => {}}>
          <input aria-label="editor" />
        </WindowFrame>
      </DesktopProvider>
    </PreferencesProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Open About' }));
  expect(screen.getByRole('region', { name: '关于我' }).getAttribute('aria-modal')).toBeNull();
  const editor = screen.getByLabelText('editor');
  act(() => editor.focus());
  fireEvent.pointerDown(editor, { button: 0 });
  expect(document.activeElement).toBe(editor);
  fireEvent.click(screen.getByRole('button', { name: '最大化关于我' }));
  expect(screen.getByRole('button', { name: '还原关于我' })).toBeTruthy();
});

function pointer(target: Element, type: string, x: number, y: number) {
  const event = new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: y });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  fireEvent(target, event);
}

it('commits title drag and resize, cancels partial gestures and restores maximized windows before dragging', () => {
  render(
    <PreferencesProvider storage={null} motionQuery={null}>
      <DesktopProvider>
        <OpenAbout />
        <WindowFrame appId="about" onClose={() => {}} onMinimize={() => {}}>
          <p>content</p>
        </WindowFrame>
      </DesktopProvider>
    </PreferencesProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Open About' }));
  const frame = screen.getByRole('region', { name: '关于我' });
  const title = frame.querySelector('header')!;
  const before = frame.style.left;
  pointer(title, 'pointerdown', 300, 100);
  pointer(frame, 'pointermove', 350, 130);
  pointer(frame, 'pointerup', 350, 130);
  expect(frame.style.left).not.toBe(before);
  const saved = frame.style.left;
  pointer(title, 'pointerdown', 350, 130);
  pointer(frame, 'pointermove', 450, 160);
  pointer(frame, 'pointercancel', 450, 160);
  expect(frame.style.left).toBe(saved);
  pointer(frame, 'pointermove', 600, 160);
  expect(frame.style.left).toBe(saved);
  fireEvent.click(screen.getByRole('button', { name: '最大化关于我' }));
  expect(frame.style.width).toBe('1000px');
  pointer(title, 'pointerdown', 500, 80);
  pointer(frame, 'pointermove', 520, 100);
  pointer(frame, 'pointerup', 520, 100);
  expect(frame.style.width).toBe('560px');
  const resize = screen.getByRole('button', { name: '调整关于我大小' });
  pointer(resize, 'pointerdown', 700, 500);
  pointer(frame, 'pointermove', 730, 520);
  pointer(frame, 'pointerup', 730, 520);
  expect(frame.style.width).toBe('590px');
});

it('keeps a maximized window unchanged on title clicks and toggles once on a title double click', () => {
  render(
    <PreferencesProvider storage={null} motionQuery={null}>
      <DesktopProvider>
        <OpenAbout />
        <WindowFrame appId="about" onClose={() => {}} onMinimize={() => {}}>
          <p>content</p>
        </WindowFrame>
      </DesktopProvider>
    </PreferencesProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Open About' }));
  const frame = screen.getByRole('region', { name: '关于我' });
  const title = frame.querySelector('header')!;
  fireEvent.click(screen.getByRole('button', { name: '最大化关于我' }));
  pointer(title, 'pointerdown', 500, 80);
  pointer(title, 'pointerup', 500, 80);
  expect(frame.style.width).toBe('1000px');
  pointer(title, 'pointerdown', 500, 80);
  pointer(title, 'pointerup', 500, 80);
  fireEvent.doubleClick(title);
  expect(frame.style.width).toBe('560px');
});
