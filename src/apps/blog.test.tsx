// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { siteConfig } from '../config/index.ts';
import type { BlogFeed } from '../blog/types.ts';
import { BlogApp } from './blog';

afterEach(cleanup);
const noFeed: BlogFeed = { state: 'unconfigured', sourceUrl: null, fetchedAt: null, posts: [] };

it('offers an honest blog empty state and only real external article navigation', () => {
  const { rerender } = render(<BlogApp feed={noFeed} blog={{ ...siteConfig.blog, url: undefined, posts: [] }} />);
  expect(screen.getByText('独立博客筹备中')).toBeDefined();
  expect(screen.queryByRole('link')).toBeNull();
  rerender(<BlogApp feed={noFeed} blog={{ ...siteConfig.blog, url: 'https://honestman.me/blog', posts: [
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

it('renders feed metadata as text and keeps independent article navigation when using a cached snapshot', () => {
  render(<BlogApp blog={{ ...siteConfig.blog, url: 'https://blog.honestman.me' }} feed={{ state: 'cached', sourceUrl: 'https://blog.honestman.me/rss.xml', fetchedAt: '2026-10-23T12:00:00Z', posts: [
    { id: 'rss', title: '<img src=x onerror=bad()>', summary: '<b>纯文本摘要</b>', url: 'https://blog.honestman.me/notes', date: '2026-10-22T12:00:00Z' },
  ] }} />);
  expect(screen.getByRole('heading', { name: '<img src=x onerror=bad()>' })).toBeDefined();
  expect(document.querySelector('.blog-content img')).toBeNull();
  expect(screen.getByRole('link', { name: /img src/ }).getAttribute('href')).toBe('https://blog.honestman.me/notes');
  expect(screen.getByText(/显示上次更新的文章/)).toBeDefined();
});
