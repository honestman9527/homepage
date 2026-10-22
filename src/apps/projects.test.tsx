// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { siteConfig } from '../config/content';
import { ProjectsApp } from './projects';

afterEach(cleanup);

describe('project application session', () => {
  it('replaces the list with detail and restores list scroll and the initiating action on return', () => {
    render(<ProjectsApp projects={siteConfig.projects} onOpen={() => {}} />);
    const scroller = screen.getByRole('region', { name: '项目内容' });
    scroller.scrollTop = 140;
    const trigger = screen.getByRole('button', { name: '了解小小宇宙' });
    fireEvent.click(trigger);
    expect(screen.queryByRole('button', { name: '了解HonestOS' })).toBeNull();
    expect(screen.getByRole('heading', { name: '小小宇宙' })).toBeDefined();
    expect(scroller.scrollTop).toBe(0);
    scroller.scrollTop = 80;
    fireEvent.click(screen.getByRole('button', { name: '返回项目列表' }));
    expect(scroller.scrollTop).toBe(140);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '了解小小宇宙' }));
  });

  it('keeps independent safe project links and usable text when an image fails', () => {
    const projects = [
      { ...siteConfig.projects[0]!, image: '/missing-project.png', url: 'https://honestman.me', sourceUrl: 'https://github.com/honestman9527/homepage' },
      { ...siteConfig.projects[1]!, sourceUrl: 'javascript:alert(1)' },
    ];
    render(<ProjectsApp projects={projects} onOpen={() => {}} />);
    fireEvent.error(screen.getByAltText('HonestOS 项目预览'));
    expect(screen.queryByAltText('HonestOS 项目预览')).toBeNull();
    expect(screen.getByText('把个人主页，变成一张可以探索的桌面。')).toBeDefined();
    expect(screen.queryByRole('link', { name: /在线访问/ })).toBeNull();
    expect(screen.getByRole('link', { name: /查看源码/ }).getAttribute('href')).toBe('https://github.com/honestman9527/homepage');
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('returns focus to the list when a selected project disappears and keeps empty content navigable', () => {
    const onOpen = vi.fn();
    const { rerender } = render(<ProjectsApp projects={siteConfig.projects} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: '了解小小宇宙' }));
    rerender(<ProjectsApp projects={siteConfig.projects.filter(project => project.id !== 'universe')} onOpen={onOpen} />);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: '我的项目' }));
    expect(screen.getByRole('button', { name: '了解HonestOS' })).toBeDefined();
    rerender(<ProjectsApp projects={[]} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: '先认识一下我' }));
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('about');
  });

  it('retains detail reading position when a hidden app becomes visible after a viewport change', () => {
    render(<ProjectsApp projects={siteConfig.projects} onOpen={() => {}} />);
    const scroller = screen.getByRole('region', { name: '项目内容' });
    let viewportHeight = 120;
    Object.defineProperty(scroller, 'clientHeight', { configurable: true, get: () => viewportHeight });
    fireEvent.click(screen.getByRole('button', { name: '了解小小宇宙' }));
    scroller.scrollTop = 85;
    fireEvent.scroll(scroller);
    viewportHeight = 0;
    scroller.scrollTop = 0;
    fireEvent(window, new Event('resize'));
    viewportHeight = 120;
    fireEvent(window, new Event('resize'));
    expect(scroller.scrollTop).toBe(85);
    expect(screen.getByRole('heading', { name: '小小宇宙' })).toBeDefined();
  });
});
