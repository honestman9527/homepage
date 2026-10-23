// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PreferencesProvider } from '../../src/preferences/provider';
import { SettingsApp } from '../../src/apps/settings';
import { TerminalApp } from '../../src/apps/terminal';

afterEach(cleanup);

it('changes shared wallpaper and motion preferences while respecting the system and arranging through the shell', () => {
  const onArrange = vi.fn();
  render(<PreferencesProvider storage={null} motionQuery={{ matches: true, addEventListener() {}, removeEventListener() {} }}><SettingsApp onArrange={onArrange} /></PreferencesProvider>);
  fireEvent.click(screen.getByRole('button', { name: '壁纸' }));
  fireEvent.click(screen.getByRole('radio', { name: '午夜蓝调' }));
  expect((screen.getByRole('radio', { name: '午夜蓝调' }) as HTMLInputElement).checked).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: '程序坞与动效' }));
  expect(screen.getByText(/系统已要求减弱动态效果/)).toBeDefined();
  const motion = screen.getByRole('checkbox', { name: '启用界面动效' }) as HTMLInputElement;
  expect(motion.checked).toBe(true);
  fireEvent.click(motion);
  expect(motion.checked).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: '整理桌面' }));
  expect(onArrange).toHaveBeenCalledOnce();
  expect(screen.getByRole('status').textContent).toContain('仅在本次访问有效');
});

it('applies terminal wallpaper commands to the same settings state even when storage fails', () => {
  render(<PreferencesProvider storage={{ getItem: () => null, setItem: () => { throw new Error('storage denied'); } }} motionQuery={null}>
    <TerminalApp onOpen={() => {}} /><SettingsApp onArrange={() => {}} />
  </PreferencesProvider>);
  fireEvent.click(screen.getByRole('button', { name: '壁纸' }));
  const input = screen.getByRole('textbox', { name: '终端命令' });
  fireEvent.change(input, { target: { value: 'theme night' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect((screen.getByRole('radio', { name: '午夜蓝调' }) as HTMLInputElement).checked).toBe(true);
  expect(screen.getByText('浏览器暂时无法保存偏好，当前选择仅在本次访问有效。')).toBeDefined();
  fireEvent.click(screen.getByRole('radio', { name: '薄荷晨光' }));
  expect((screen.getByRole('radio', { name: '薄荷晨光' }) as HTMLInputElement).checked).toBe(true);
});

it('changes appearance and Dock options, then restores the default preferences', () => {
  const saved: string[] = [];
  render(<PreferencesProvider storage={{ getItem: () => null, setItem: (_key, value) => saved.push(value) }} motionQuery={null}><SettingsApp onArrange={() => {}} /></PreferencesProvider>);
  fireEvent.click(screen.getByRole('radio', { name: '深色' }));
  fireEvent.change(screen.getByRole('slider', { name: /玻璃不透明度/ }), { target: { value: '90' } });
  fireEvent.click(screen.getByRole('button', { name: '程序坞与动效' }));
  fireEvent.click(screen.getByRole('radio', { name: '小' }));
  fireEvent.click(screen.getByRole('checkbox', { name: '自动隐藏程序坞' }));
  expect(JSON.parse(saved.at(-1)!)).toMatchObject({ appearance: 'dark', glassOpacity: 90, dockSize: 'small', dockAutoHide: true });
  fireEvent.click(screen.getByRole('button', { name: '恢复默认设置' }));
  expect(JSON.parse(saved.at(-1)!)).toMatchObject({ appearance: 'system', glassOpacity: 65, dockSize: 'medium', dockAutoHide: false });
});
