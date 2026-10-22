// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AppContent } from './content';

afterEach(cleanup);

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
