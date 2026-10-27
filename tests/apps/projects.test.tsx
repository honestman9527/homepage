// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { Project } from '../../src/config/index.ts';
import { ProjectsApp } from '../../src/apps/projects.tsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function project(overrides: Partial<Project> = {}): Project {
  return { id: 'tool', name: '小工具', status: 'building', ...overrides };
}

const onlineUrl = 'https://tools.honestman.me/';
const sourceUrl = 'https://github.com/honestman9527/tool';
const articleUrl = 'https://blog.honestman.me/posts/tool';

describe('project list', () => {
  it.each([undefined, '', ' \n '])('omits an absent or blank summary (%j)', (summary) => {
    render(
      <ProjectsApp
        projects={[project({ summary, year: '2026', currentSite: true })]}
        onOpen={() => {}}
      />,
    );
    const item = screen.getByRole('article', { name: '小工具' });
    expect(within(item).getByRole('heading', { name: '小工具' })).toBeDefined();
    expect(within(item).getByText('开发中')).toBeDefined();
    expect(within(item).getByText('2026')).toBeDefined();
    expect(within(item).getByText('本站')).toBeDefined();
    expect(item.querySelector('p')).toBeNull();
    expect(within(item).queryByRole('navigation')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('shows a plain-text summary without turning the title or row into a control', () => {
    render(
      <ProjectsApp
        projects={[project({ summary: '把 <b>灵感</b> 变成工具。' })]}
        onOpen={() => {}}
      />,
    );
    const heading = screen.getByRole('heading', { name: '小工具' });
    expect(screen.getByText('把 <b>灵感</b> 变成工具。').querySelector('b')).toBeNull();
    fireEvent.click(heading);
    expect(screen.getByRole('heading', { name: '我的项目' })).toBeDefined();
    expect(screen.queryByRole('button')).toBeNull();
    expect(heading.closest('a, button, [role="button"]')).toBeNull();
    expect(screen.getByRole('region', { name: '项目内容' }).querySelectorAll('p')).toHaveLength(1);
  });

  it('orders the three independent external actions and opens them safely', () => {
    render(
      <ProjectsApp
        projects={[project({ status: 'live', url: onlineUrl, sourceUrl, articleUrl })]}
        onOpen={() => {}}
      />,
    );
    const links = within(screen.getByRole('navigation', { name: '小工具链接' })).getAllByRole(
      'link',
    );
    expect(links.map((link) => link.textContent)).toEqual([
      '在线访问（新标签打开）',
      '查看源码（新标签打开）',
      '项目介绍（新标签打开）',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      onlineUrl,
      sourceUrl,
      articleUrl,
    ]);
    for (const link of links) {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      expect(link.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it.each([
    { status: 'live', visible: true },
    { status: 'building', visible: true },
    { status: 'archived', visible: true },
    { status: 'idea', visible: false },
    { status: 'live', currentSite: true, visible: false },
    { status: 'building', currentSite: true, visible: false },
  ] as const)(
    'applies online-link rules for %j without hiding source or article',
    ({ visible, ...state }) => {
      render(
        <ProjectsApp
          projects={[project({ ...state, url: onlineUrl, sourceUrl, articleUrl })]}
          onOpen={() => {}}
        />,
      );
      expect(Boolean(screen.queryByRole('link', { name: /在线访问/ }))).toBe(visible);
      expect(screen.getByRole('link', { name: /查看源码/ }).getAttribute('href')).toBe(sourceUrl);
      expect(screen.getByRole('link', { name: /项目介绍/ }).getAttribute('href')).toBe(articleUrl);
    },
  );

  it.each(['javascript:alert(1)', '/posts/tool', 'https://example.com/tool', ''])(
    'hides invalid destinations (%j) without rendering an empty action group',
    (invalid) => {
      render(
        <ProjectsApp
          projects={[project({ url: invalid, sourceUrl: invalid, articleUrl: invalid })]}
          onOpen={() => {}}
        />,
      );
      expect(screen.queryByRole('link')).toBeNull();
      expect(screen.queryByRole('navigation')).toBeNull();
    },
  );

  it('supports an article as the only action', () => {
    render(<ProjectsApp projects={[project({ articleUrl })]} onOpen={() => {}} />);
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: /项目介绍/ }).getAttribute('href')).toBe(articleUrl);
  });

  it('keeps text and actions usable when an image fails, and accepts a replacement image', () => {
    const item = project({ image: '/missing-project.png', summary: '一个小工具。', articleUrl });
    const { rerender } = render(<ProjectsApp projects={[item]} onOpen={() => {}} />);
    fireEvent.error(screen.getByAltText('小工具 项目预览'));
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('一个小工具。')).toBeDefined();
    expect(screen.getByRole('link', { name: /项目介绍/ })).toBeDefined();
    rerender(<ProjectsApp projects={[{ ...item, image: '/replacement.png' }]} onOpen={() => {}} />);
    expect(screen.getByAltText('小工具 项目预览').getAttribute('src')).toBe('/replacement.png');
  });

  it('keeps empty content navigable', () => {
    const onOpen = vi.fn();
    const { rerender } = render(<ProjectsApp projects={[project()]} onOpen={onOpen} />);
    rerender(<ProjectsApp projects={[]} onOpen={onOpen} />);
    expect(screen.queryByRole('article')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '先认识一下我' }));
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('about');
  });

  it('restores list scroll after hidden resizes and disconnects observers on close', () => {
    let notifyResize: () => void = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          notifyResize = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    const { unmount } = render(<ProjectsApp projects={[project()]} onOpen={() => {}} />);
    const scroller = screen.getByRole('region', { name: '项目内容' });
    let viewportHeight = 120;
    Object.defineProperty(scroller, 'clientHeight', { get: () => viewportHeight });
    scroller.scrollTop = 85;
    fireEvent.scroll(scroller);
    viewportHeight = 0;
    scroller.scrollTop = 0;
    fireEvent.scroll(scroller);
    fireEvent(window, new Event('resize'));
    expect(scroller.scrollTop).toBe(0);
    viewportHeight = 120;
    notifyResize();
    expect(scroller.scrollTop).toBe(85);
    scroller.scrollTop = 0;
    fireEvent(window, new Event('resize'));
    expect(scroller.scrollTop).toBe(85);
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
