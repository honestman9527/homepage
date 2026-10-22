// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreferencesProvider } from '../preferences/provider';
import { TerminalApp } from './terminal';

afterEach(cleanup);

function renderTerminal() {
  const onOpen = vi.fn();
  render(<PreferencesProvider storage={null} motionQuery={null}><TerminalApp onOpen={onOpen} /></PreferencesProvider>);
  const input = screen.getByRole('textbox', { name: '终端命令' }) as HTMLInputElement;
  const run = (text: string) => { fireEvent.change(input, { target: { value: text } }); fireEvent.keyDown(input, { key: 'Enter' }); };
  return { input, run, onOpen, output: screen.getByRole('log', { name: '终端输出' }) };
}

describe('terminal application session', () => {
  it('renders command HTML as literal text and clear removes the welcome while retaining history', () => {
    const { input, run, output, onOpen } = renderTerminal();
    expect(within(output).getByText(/输入 help/)).toBeDefined();
    run('echo Hello   <img src=x onerror=alert(1)>');
    expect(within(output).getByText('Hello <img src=x onerror=alert(1)>')).toBeDefined();
    expect(output.querySelector('img')).toBeNull();
    run('clear');
    expect(output.textContent).toBe('');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('clear');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('echo Hello   <img src=x onerror=alert(1)>');
    run('open projects');
    expect(onOpen).toHaveBeenLastCalledWith('projects');
  });

  it('caps oversized input with visible feedback before it can be executed', () => {
    const { input, output } = renderTerminal();
    fireEvent.change(input, { target: { value: `echo ${'x'.repeat(2000)}` } });
    expect(input.value).toHaveLength(2000);
    expect(screen.getByRole('status').textContent).toContain('2,000');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(output.textContent).not.toContain('xxx');
    fireEvent.change(input, { target: { value: 'echo checked' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(within(output).getByText('checked')).toBeDefined();
  });

  it('follows output only from the bottom and preserves a reader position until they request new output', () => {
    const { run, output } = renderTerminal();
    Object.defineProperties(output, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, get: () => output.children.length * 100 },
    });
    run('echo first');
    expect(output.scrollTop).toBe(200);
    output.scrollTop = 40;
    fireEvent.scroll(output);
    run('echo second');
    expect(output.scrollTop).toBe(40);
    fireEvent.click(screen.getByRole('button', { name: '查看新输出' }));
    expect(output.scrollTop).toBe(400);
    expect(screen.queryByRole('button', { name: '查看新输出' })).toBeNull();
  });

  it('protects IME Enter, restores drafts and completes native input without trapping Shift+Tab', async () => {
    const user = userEvent.setup();
    const { input, onOpen } = renderTerminal();
    fireEvent.change(input, { target: { value: 'open projects' } });
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true, keyCode: 229 });
    expect(onOpen).not.toHaveBeenCalled();
    expect(input.value).toBe('open projects');
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('projects');
    fireEvent.change(input, { target: { value: 'unfinished draft' } });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('open projects');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.value).toBe('unfinished draft');
    fireEvent.change(input, { target: { value: 'open pro' } });
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(input.value).toBe('open projects ');
    input.focus();
    await user.tab({ shift: true });
    expect(document.activeElement).not.toBe(input);
  });
});
