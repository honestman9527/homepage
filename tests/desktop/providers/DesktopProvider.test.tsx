// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { useState } from 'react';
import { DesktopProvider, getWindowPresentation, useDesktop } from '../../../src/desktop/index.ts';

afterEach(cleanup);
function Session() {
  const [draft, setDraft] = useState('');
  return (
    <input aria-label="draft" value={draft} onChange={(event) => setDraft(event.target.value)} />
  );
}
function DesktopProbe() {
  const desktop = useDesktop();
  const terminal = desktop.state.windows.terminal;
  return (
    <>
      <output data-testid="desktop-state">
        {JSON.stringify({
          mode: desktop.state.mode,
          geometry: terminal.normalGeometry,
          session: terminal.sessionId,
        })}
      </output>
      <button onClick={() => desktop.minimize('terminal')}>hide</button>
      <button onClick={() => desktop.open('terminal')}>restore</button>
      <button
        onClick={() => {
          desktop.close('terminal');
          desktop.open('terminal');
        }}
      >
        restart
      </button>
      <button onClick={desktop.arrange}>arrange</button>
      {terminal.sessionId !== null && (
        <section
          hidden={!getWindowPresentation(desktop.state, 'terminal').visible}
          key={terminal.sessionId}
        >
          <Session />
        </section>
      )}
    </>
  );
}

it('keeps mounted session content while hidden and resets immediate batched close and reopen', () => {
  render(
    <DesktopProvider
      initialViewport={{
        width: 1366,
        height: 768,
        availableArea: { x: 0, y: 48, width: 1366, height: 616 },
      }}
    >
      <DesktopProbe />
    </DesktopProvider>,
  );
  fireEvent.click(screen.getByText('restore'));
  fireEvent.change(screen.getByLabelText('draft'), { target: { value: 'my saved command' } });
  fireEvent.click(screen.getByText('hide'));
  fireEvent.click(screen.getByText('restore'));
  expect((screen.getByLabelText('draft') as HTMLInputElement).value).toBe('my saved command');
  fireEvent.click(screen.getByText('arrange'));
  expect((screen.getByLabelText('draft') as HTMLInputElement).value).toBe('my saved command');
  fireEvent.click(screen.getByText('restart'));
  expect((screen.getByLabelText('draft') as HTMLInputElement).value).toBe('');
});

it('ignores visual viewport keyboard changes while preserving desktop sessions and normal geometry', () => {
  const visualViewport = new EventTarget();
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: visualViewport });
  render(
    <DesktopProvider>
      <DesktopProbe />
    </DesktopProvider>,
  );
  fireEvent.click(screen.getByText('restore'));
  const before = screen.getByTestId('desktop-state').textContent;
  fireEvent.change(screen.getByLabelText('draft'), { target: { value: 'keyboard draft' } });
  act(() => {
    visualViewport.dispatchEvent(new Event('resize'));
    visualViewport.dispatchEvent(new Event('scroll'));
  });
  expect((screen.getByLabelText('draft') as HTMLInputElement).value).toBe('keyboard draft');
  expect(screen.getByTestId('desktop-state').textContent).toBe(before);
});
