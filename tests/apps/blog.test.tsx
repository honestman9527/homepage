// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { siteConfig } from '../../src/config/index.ts';
import { BlogApp } from '../../src/apps/blog';

afterEach(cleanup);

it('offers an honest blog empty state and only real external article navigation', () => {
  const { rerender } = render(<BlogApp blog={{ ...siteConfig.blog, url: undefined, posts: [] }} />);
  expect(screen.getByText('独立博客筹备中')).toBeDefined();
  expect(screen.queryByRole('link')).toBeNull();
  rerender(<BlogApp blog={{ ...siteConfig.blog, url: 'https://honestman.me/blog', posts: [] }} />);
  expect(screen.getByText('精选文章正在整理中，可以先去博客逛逛。')).toBeDefined();
  expect(screen.getAllByRole('link')).toHaveLength(1);
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

it('preserves the author’s featured order and renders article text without interpreting HTML', () => {
  render(<BlogApp blog={{ ...siteConfig.blog, url: 'https://blog.honestman.me', posts: [
    { id: 'featured', title: '<img src=x onerror=bad()>', summary: '<b>纯文本摘要</b>', url: 'https://blog.honestman.me/notes', date: '2026-10-22' },
    { id: 'newer', title: '较新的文章', summary: '', url: 'https://blog.honestman.me/newer', date: '2026-10-23' },
  ] }} />);
  expect(screen.getByRole('heading', { name: '<img src=x onerror=bad()>' })).toBeDefined();
  expect(document.querySelector('.blog-content img')).toBeNull();
  expect(screen.getByRole('link', { name: /img src/ }).getAttribute('href')).toBe('https://blog.honestman.me/notes');
  expect(screen.getByText('<b>纯文本摘要</b>')).toBeDefined();
  expect(screen.getByRole('region', { name: '精选文章' })).toBeDefined();
  expect(screen.getAllByRole('heading', { level: 3 }).map(heading => heading.textContent)).toEqual(['<img src=x onerror=bad()>', '较新的文章']);
});
