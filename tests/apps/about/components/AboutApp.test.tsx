// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { Profile } from '../../../../src/config/index.ts';
import { AboutApp } from '../../../../src/apps/about/components/AboutApp.tsx';

afterEach(cleanup);

it('renders configured contact logos and labels while keeping email and external navigation distinct', () => {
  const profile: Profile = {
    name: '测试作者',
    alias: '测试昵称',
    headline: '从一个点子开始',
    introduction: '这是组件测试资料。',
    description: '测试简介。',
    interests: [],
    status: '测试中',
    links: [
      'mailto:hello@honestman.me',
      { label: '代码主页', url: 'https://github.com/honestman9527' },
      { label: '独立站', url: 'https://honestman.me' },
      { label: '无效链接', url: 'javascript:alert(1)' },
    ],
  };
  render(<AboutApp profile={profile} onOpen={() => {}} />);
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
