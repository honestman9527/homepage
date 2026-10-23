// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it } from 'vitest';
import { useState } from 'react';
import { SearchPanel } from '../../src/ui/search-panel.tsx';

afterEach(cleanup);
function SearchProbe() {
  const [selected, setSelected] = useState('');
  return (
    <>
      <output data-testid="selection">{selected}</output>
      <SearchPanel onCancel={() => setSelected('cancel')} onOpen={setSelected} />
    </>
  );
}
it('focuses search, navigates results and never opens a stale selection after a no-result query', async () => {
  const user = userEvent.setup();
  render(<SearchProbe />);
  const input = screen.getByRole('combobox');
  expect(document.activeElement).toBe(input);
  await user.keyboard('{ArrowDown}');
  fireEvent.change(input, { target: { value: 'no-such-app' } });
  await user.keyboard('{Enter}');
  expect(screen.getByText(/没有找到应用/).textContent).toContain('没有找到');
  expect(screen.getByTestId('selection').textContent).toBe('');
  fireEvent.change(input, { target: { value: 'terminal' } });
  await user.keyboard('{Enter}');
  expect(screen.getByTestId('selection').textContent).toBe('terminal');
});
it('keeps Tab inside search and cancels with Escape', async () => {
  const user = userEvent.setup();
  render(<SearchProbe />);
  await user.keyboard('{Shift>}{Tab}{/Shift}');
  expect(document.activeElement?.closest('[role="dialog"]')).not.toBeNull();
  await user.keyboard('{Escape}');
  expect(screen.getByTestId('selection').textContent).toBe('cancel');
});

it('ignores Enter while an input method is composing', () => {
  render(<SearchProbe />);
  fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter', isComposing: true });
  expect(screen.getByTestId('selection').textContent).toBe('');
});
