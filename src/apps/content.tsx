import { Suspense, memo } from 'react';
import { createAppLoader } from './loading.ts';
import { siteConfig, type AppId } from '../config/index.ts';
import { AboutApp } from './about.tsx';
import { TerminalApp } from './terminal';
import './apps.css';

const ProjectsAppLoader = createAppLoader<Parameters<typeof import('./projects').ProjectsApp>[0]>(
  () => import('./projects').then((module) => ({ default: module.ProjectsApp })),
);
const BlogAppLoader = createAppLoader<Parameters<typeof import('./blog').BlogApp>[0]>(() =>
  import('./blog').then((module) => ({ default: module.BlogApp })),
);
const SettingsAppLoader = createAppLoader<Parameters<typeof import('./settings').SettingsApp>[0]>(
  () => import('./settings').then((module) => ({ default: module.SettingsApp })),
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
