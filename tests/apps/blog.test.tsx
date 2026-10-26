// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { siteConfig } from '../../src/config/index.ts';
import { BlogApp } from '../../src/apps/blog';

const rss = (title = '真实文章') => `<rss version="2.0"><channel><item>
  <title>${title}</title><link>https://blog.honestman.me/notes</link>
  <description><![CDATA[<b>正文在独立博客阅读。</b>]]></description>
  <pubDate>Thu, 22 Oct 2026 10:00:00 GMT</pubDate>
</item></channel></rss>`;
const response = (xml: string) => new Response(xml, { status: 200 });
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it('does not request an unconfigured or invalid RSS address and preserves the blog entry', () => {
  const { rerender } = render(
    <BlogApp blog={{ ...siteConfig.blog, url: undefined, rssUrl: undefined }} />,
  );
  expect(screen.getByText('独立博客筹备中')).toBeDefined();
  expect(screen.queryByRole('link')).toBeNull();
  rerender(<BlogApp blog={{ ...siteConfig.blog, rssUrl: 'javascript:alert(1)' }} />);
  expect(screen.getByText('暂未配置文章订阅，可以先去博客逛逛。')).toBeDefined();
  expect(screen.getAllByRole('link')).toHaveLength(1);
  expect(fetchMock).not.toHaveBeenCalled();
});

it('loads configured RSS in the client and shows article metadata and external navigation', async () => {
  let resolve!: (value: Response) => void;
  fetchMock.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  render(<BlogApp blog={siteConfig.blog} />);
  expect(screen.getByRole('status').textContent).toBe('正在加载文章…');
  expect(fetchMock).toHaveBeenCalledWith(
    'https://blog.honestman.me/rss.xml',
    expect.objectContaining({
      mode: 'cors',
      credentials: 'omit',
      signal: expect.any(AbortSignal),
    }),
  );
  await act(async () => resolve(response(rss())));
  expect((await screen.findByRole('link', { name: /真实文章/ })).getAttribute('href')).toBe(
    'https://blog.honestman.me/notes',
  );
  expect(screen.getByRole('link', { name: /真实文章/ }).getAttribute('target')).toBe('_blank');
  expect(screen.getByRole('link', { name: /打开独立博客/ }).getAttribute('href')).toBe(
    'https://blog.honestman.me/',
  );
  expect(screen.getByText('正文在独立博客阅读。')).toBeDefined();
  expect(document.querySelector('time')?.dateTime).toBe('2026-10-22T10:00:00.000Z');
  expect(screen.getByRole('region', { name: '最新文章' })).toBeDefined();
  expect(screen.queryByRole('status')).toBeNull();
});

it('shows the empty feed state without hiding the independent blog entry', async () => {
  fetchMock.mockResolvedValue(response('<rss><channel /></rss>'));
  render(<BlogApp blog={siteConfig.blog} />);
  expect(await screen.findByText('暂时没有文章，可以先去博客逛逛。')).toBeDefined();
  expect(screen.getByRole('link', { name: /打开独立博客/ })).toBeDefined();
});

it.each(['network', 'http', 'xml'])(
  'recovers from a %s failure with an explicit retry',
  async (failure) => {
    if (failure === 'network') fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    else
      fetchMock.mockResolvedValueOnce(
        failure === 'http' ? new Response('', { status: 503 }) : response('<html>not RSS</html>'),
      );
    fetchMock.mockResolvedValueOnce(response(rss()));
    render(<BlogApp blog={siteConfig.blog} />);
    expect(await screen.findByRole('alert')).toBeDefined();
    expect(screen.getByRole('link', { name: /打开独立博客/ })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: '重新加载文章' }));
    expect(await screen.findByRole('heading', { name: '真实文章' })).toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).toBeNull();
  },
);

it('aborts a slow request and offers a retry after the timeout', async () => {
  vi.useFakeTimers();
  fetchMock.mockImplementation(
    (_url, options) =>
      new Promise((_resolve, reject) => {
        options?.signal?.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        );
      }),
  );
  render(<BlogApp blog={siteConfig.blog} />);
  await act(async () => vi.advanceTimersByTimeAsync(15_000));
  expect(screen.getByRole('alert')).toBeDefined();
  expect(screen.getByRole('button', { name: '重新加载文章' })).toBeDefined();
  expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
});

it('aborts on source change and ignores late responses from the previous source', async () => {
  let resolveOld!: (value: Response) => void;
  fetchMock.mockReturnValueOnce(
    new Promise((resolve) => {
      resolveOld = resolve;
    }),
  );
  fetchMock.mockResolvedValueOnce(response(rss('新来源文章')));
  const { rerender, unmount } = render(<BlogApp blog={siteConfig.blog} />);
  const oldSignal = fetchMock.mock.calls[0]?.[1]?.signal;
  rerender(
    <BlogApp blog={{ ...siteConfig.blog, rssUrl: 'https://blog.honestman.me/new-rss.xml' }} />,
  );
  expect(oldSignal?.aborted).toBe(true);
  expect(await screen.findByRole('heading', { name: '新来源文章' })).toBeDefined();
  await act(async () => resolveOld(response(rss('旧来源文章'))));
  expect(screen.queryByText('旧来源文章')).toBeNull();
  unmount();
  expect(fetchMock.mock.calls[1]?.[1]?.signal?.aborted).toBe(true);
});

it('clears the previous article list when the configured source changes', async () => {
  fetchMock.mockResolvedValueOnce(response(rss()));
  fetchMock.mockReturnValueOnce(new Promise(() => {}));
  const { rerender } = render(<BlogApp blog={siteConfig.blog} />);
  await screen.findByRole('heading', { name: '真实文章' });
  rerender(
    <BlogApp blog={{ ...siteConfig.blog, rssUrl: 'https://blog.honestman.me/other.xml' }} />,
  );
  expect(screen.getByRole('status')).toBeDefined();
  expect(screen.queryByRole('heading', { name: '真实文章' })).toBeNull();
});
