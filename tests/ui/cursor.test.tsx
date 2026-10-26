// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { PreferencesProvider } from '../../src/preferences/index.ts';
import { CustomCursor } from '../../src/ui/cursor.tsx';

afterEach(cleanup);

it('updates desktop cursor coordinates and interactive/grab/text modes on fine pointers without treating resize or single-window titlebar as interactive/grab', () => {
  const { container } = render(
    <PreferencesProvider
      storage={null}
      motionQuery={{ matches: false, addEventListener() {}, removeEventListener() {} }}
    >
      <div className="honestos">
        <CustomCursor />
        <button type="button" id="test-btn">
          按钮
        </button>
        <button type="button" className="window-resize" id="resize-btn">
          缩放
        </button>
        <div className="window-titlebar" id="desktop-titlebar">
          桌面标题栏
        </div>
        <div className="single-window">
          <div className="window-titlebar" id="single-titlebar">
            单窗口标题栏
          </div>
        </div>
        <input type="text" id="test-input" aria-label="输入" />
      </div>
    </PreferencesProvider>,
  );

  const layer = container.querySelector<HTMLElement>('.desktop-cursor-layer')!;
  const ring = container.querySelector<HTMLElement>('.desktop-cursor-ring')!;
  const button = container.querySelector<HTMLElement>('#test-btn')!;
  const resizeButton = container.querySelector<HTMLElement>('#resize-btn')!;
  const desktopTitlebar = container.querySelector<HTMLElement>('#desktop-titlebar')!;
  const singleTitlebar = container.querySelector<HTMLElement>('#single-titlebar')!;
  const input = container.querySelector<HTMLElement>('#test-input')!;

  expect(layer.dataset.cursorVisible).toBe('false');

  fireEvent.pointerMove(button, { clientX: 240, clientY: 180, pointerType: 'mouse' });
  expect(layer.dataset.cursorVisible).toBe('true');
  expect(layer.dataset.cursorMode).toBe('interactive');
  expect(ring.style.transform).toBe('translate3d(240px, 180px, 0)');

  fireEvent.pointerMove(resizeButton, { clientX: 260, clientY: 190, pointerType: 'mouse' });
  expect(layer.dataset.cursorMode).toBe('default');

  fireEvent.pointerMove(desktopTitlebar, { clientX: 280, clientY: 200, pointerType: 'mouse' });
  expect(layer.dataset.cursorMode).toBe('grab');

  fireEvent.pointerMove(singleTitlebar, { clientX: 290, clientY: 210, pointerType: 'mouse' });
  expect(layer.dataset.cursorMode).toBe('default');

  fireEvent.pointerMove(input, { clientX: 300, clientY: 220, pointerType: 'mouse' });
  expect(layer.dataset.cursorMode).toBe('text');

  fireEvent.pointerDown(input, { pointerType: 'mouse' });
  expect(layer.dataset.cursorPressed).toBe('true');
  fireEvent.pointerUp(input, { pointerType: 'mouse' });
  expect(layer.dataset.cursorPressed).toBe('false');

  fireEvent.mouseLeave(document);
  expect(layer.dataset.cursorVisible).toBe('false');
});
