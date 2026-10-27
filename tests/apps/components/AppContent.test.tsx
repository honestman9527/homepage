// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AppContent } from '../../../src/apps/components/AppContent.tsx';
import { siteConfig } from '../../../src/config/index.ts';

const configuredLinks = siteConfig.profile.links;
afterEach(() => {
  cleanup();
  siteConfig.profile.links = configuredLinks;
});

describe('application navigation', () => {
  it('offers project navigation and explicit terminal input focus from the confirmed introduction', () => {
    const onOpen = vi.fn();
    render(<AppContent appId="about" onOpen={onOpen} onArrange={() => {}} />);
    expect(screen.getByRole('heading', { name: '保持好奇，持续折腾。' })).toBeDefined();
    expect(screen.getByText('我是 honestman，也叫爱睡觉的老实人。')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: '看看我在折腾什么' }));
    expect(onOpen).toHaveBeenLastCalledWith('projects');
    fireEvent.click(screen.getByRole('button', { name: '或者，敲点命令' }));
    expect(onOpen).toHaveBeenLastCalledWith('terminal', { focusTerminal: true });
  });
});

it('renders configured contact logos and labels while keeping email and external navigation distinct', () => {
  siteConfig.profile.links = [
    'mailto:hello@honestman.me',
    { label: '代码主页', url: 'https://github.com/honestman9527' },
    { label: '独立站', url: 'https://honestman.me' },
    { label: '无效链接', url: 'javascript:alert(1)' },
  ];
  render(<AppContent appId="about" onOpen={() => {}} onArrange={() => {}} />);
  const email = screen.getByRole('link', { name: 'hello@honestman.me' });
  expect(email.getAttribute('href')).toBe('mailto:hello@honestman.me');
  expect(email.getAttribute('target')).toBeNull();
  expect(email.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  const github = screen.getByRole('link', { name: '代码主页（新标签打开）' });
  expect(github.getAttribute('target')).toBe('_blank');
  expect(github.getAttribute('rel')).toBe('noopener noreferrer');
  expect(github.querySelector<HTMLElement>('.contact-brand')?.style.maskImage).toContain(
    'github.svg',
  );
  expect(
    screen.getByRole('link', { name: '独立站（新标签打开）' }).querySelector('svg'),
  ).not.toBeNull();
  expect(screen.queryByRole('link', { name: /无效链接/ })).toBeNull();
});
