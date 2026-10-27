import { Suspense, memo } from 'react';
import { createAppLoader } from '../model/loading.ts';
import { siteConfig, type AppId } from '../../config/index.ts';
import { AboutApp } from '../about/components/AboutApp.tsx';
import { TerminalApp } from '../terminal/components/TerminalApp.tsx';
import '../styles/index.css';

const ProjectsAppLoader = createAppLoader<
  Parameters<typeof import('../projects/components/ProjectsApp.tsx').ProjectsApp>[0]
>(() =>
  import('../projects/components/ProjectsApp.tsx').then((module) => ({
    default: module.ProjectsApp,
  })),
);
const BlogAppLoader = createAppLoader<
  Parameters<typeof import('../blog/components/BlogApp.tsx').BlogApp>[0]
>(() => import('../blog/components/BlogApp.tsx').then((module) => ({ default: module.BlogApp })));
const SettingsAppLoader = createAppLoader<
  Parameters<typeof import('../settings/components/SettingsApp.tsx').SettingsApp>[0]
>(() =>
  import('../settings/components/SettingsApp.tsx').then((module) => ({
    default: module.SettingsApp,
  })),
);

export interface AppContentProps {
  appId: AppId;
  onOpen: (appId: AppId, options?: { focusTerminal?: boolean }) => void;
  onArrange: () => void;
}

export const AppContent = memo(function AppContent(props: AppContentProps) {
  return (
    <Suspense
      fallback={
        <p className="app-content app-padded" role="status">
          正在加载应用…
        </p>
      }
    >
      <Content {...props} />
    </Suspense>
  );
});

export function retryAppLoad(appId: AppId) {
  if (appId === 'projects') ProjectsAppLoader.retry();
  if (appId === 'blog') BlogAppLoader.retry();
  if (appId === 'settings') SettingsAppLoader.retry();
}

function Content({ appId, onOpen, onArrange }: AppContentProps) {
  const ProjectsApp = ProjectsAppLoader.get();
  const BlogApp = BlogAppLoader.get();
  const SettingsApp = SettingsAppLoader.get();
  if (appId === 'projects') return <ProjectsApp projects={siteConfig.projects} onOpen={onOpen} />;
  if (appId === 'blog') return <BlogApp blog={siteConfig.blog} />;
  if (appId === 'settings') return <SettingsApp onArrange={onArrange} />;
  if (appId === 'terminal') return <TerminalApp onOpen={onOpen} />;
  if (appId !== 'about') return null;
  return <AboutApp profile={siteConfig.profile} onOpen={onOpen} />;
}
