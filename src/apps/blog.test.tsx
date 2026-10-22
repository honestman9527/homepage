// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { siteConfig } from '../config/index.ts';
import { BlogApp } from './blog';

afterEach(cleanup);

it('offers an honest blog empty state and only real external article navigation', () => {
  const { rerender } = render(<BlogApp blog={siteConfig.blog} />);
  expect(screen.getByText('独立博客筹备中')).toBeDefined();
  expect(screen.queryByRole('link')).toBeNull();
  rerender(<BlogApp blog={{ ...siteConfig.blog, url: 'https://honestman.me/blog', posts: [
    { id: 'real', title: '真实文章', summary: '正文在独立博客阅读。', date: '2026-10-22', url: 'https://honestman.me/blog/real' },
    { id: 'sample', title: '示例文章', summary: '', sample: true, url: 'https://honestman.me/blog/sample' },
    { id: 'unsafe', title: '非法文章', summary: '', url: 'javascript:alert(1)' },
  ] }} />);
  expect(screen.getByRole('link', { name: /打开独立博客/ }).getAttribute('target')).toBe('_blank');
  expect(screen.getByRole('link', { name: /真实文章/ }).getAttribute('href')).toBe('https://honestman.me/blog/real');
  expect(screen.queryByText('示例文章')).toBeNull();
  expect(screen.queryByText('非法文章')).toBeNull();
  expect(screen.getAllByRole('link')).toHaveLength(2);
});
