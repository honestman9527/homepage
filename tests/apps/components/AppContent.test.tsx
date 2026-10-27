// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AppContent } from '../../../src/apps/components/AppContent.tsx';
import { siteConfig } from '../../../src/config/index.ts';

afterEach(cleanup);

describe('application navigation', () => {
  it('wires the configured profile and navigation into the about application', () => {
    const onOpen = vi.fn();
    render(<AppContent appId="about" onOpen={onOpen} onArrange={() => {}} />);
    expect(screen.getByRole('heading', { name: siteConfig.profile.headline })).toBeDefined();
    expect(screen.getByText(siteConfig.profile.introduction)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: '看看我在折腾什么' }));
    expect(onOpen).toHaveBeenLastCalledWith('projects');
    fireEvent.click(screen.getByRole('button', { name: '或者，敲点命令' }));
    expect(onOpen).toHaveBeenLastCalledWith('terminal', { focusTerminal: true });
  });
});
