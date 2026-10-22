// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PreferencesProvider } from '../preferences/provider';
import { SettingsApp } from './settings';

afterEach(cleanup);

it('changes shared wallpaper and motion preferences while respecting the system and arranging through the shell', () => {
  const onArrange = vi.fn();
  render(<PreferencesProvider storage={null} motionQuery={{ matches: true, addEventListener() {}, removeEventListener() {} }}><SettingsApp onArrange={onArrange} /></PreferencesProvider>);
  fireEvent.click(screen.getByRole('radio', { name: '午夜蓝调' }));
  expect((screen.getByRole('radio', { name: '午夜蓝调' }) as HTMLInputElement).checked).toBe(true);
  expect(screen.getByText(/系统已要求减弱动态效果/)).toBeDefined();
  const motion = screen.getByRole('checkbox', { name: '启用界面动效' }) as HTMLInputElement;
  expect(motion.checked).toBe(true);
  fireEvent.click(motion);
  expect(motion.checked).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: '整理桌面' }));
  expect(onArrange).toHaveBeenCalledOnce();
  expect(screen.getByRole('status').textContent).toContain('仅在本次访问有效');
});
