import { Suspense, memo } from 'react';
import { createAppLoader } from './loading.ts';
import { profileLinks, publicUrl, siteConfig, type AppId } from '../config/index.ts';
import { TerminalApp } from './terminal';
import { ContactIcon } from '../ui/contact-icon.tsx';
import './apps.css';
const ProjectsAppLoader = createAppLoader<Parameters<typeof import('./projects').ProjectsApp>[0]>(() => import('./projects').then(module => ({ default: module.ProjectsApp })));
const BlogAppLoader = createAppLoader<Parameters<typeof import('./blog').BlogApp>[0]>(() => import('./blog').then(module => ({ default: module.BlogApp })));
const SettingsAppLoader = createAppLoader<Parameters<typeof import('./settings').SettingsApp>[0]>(() => import('./settings').then(module => ({ default: module.SettingsApp })));

export interface AppContentProps {
  appId: AppId;
  onOpen: (appId: AppId, options?: { focusTerminal?: boolean }) => void;
  onArrange: () => void;
}

export const AppContent = memo(function AppContent(props: AppContentProps) {
  return <Suspense fallback={<p className="app-content app-padded" role="status">正在加载应用…</p>}><Content {...props} /></Suspense>;
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
  const profile = siteConfig.profile;
  return <section className="app-content about-content">
    <div className="about-story">
      <div className="about-identity"><img className="profile-avatar" src="/avatar.webp" alt={`${profile.name} 的头像`} /><div><strong>{profile.name}</strong><p className="app-muted">{profile.alias}</p></div></div>
      <h1>{profile.headline}</h1>
      <p className="about-introduction">{profile.introduction}</p>
      <p className="app-muted">{profile.description}</p>
      <ul className="interest-list">{profile.interests.map(interest => <li key={interest}>{interest}</li>)}</ul>
      <div className="about-actions">
        <button className="app-button app-primary" onClick={() => onOpen('projects')}>看看我在折腾什么</button>
        <button className="app-button app-text-button" onClick={() => onOpen('terminal', { focusTerminal: true })}>或者，敲点命令</button>
      </div>
      {profile.links.length ? <nav className="profile-links" aria-label="公开联系方式">{profileLinks(profile.links).map(link => {
        const url = publicUrl(link.url, link.kind);
        return url ? <a key={`${link.label}:${url}`} href={url} target={link.kind === 'email' ? undefined : '_blank'} rel={link.kind === 'email' ? undefined : 'noopener noreferrer'}><ContactIcon name={link.icon} />{link.label}{link.kind === 'email' ? null : <span className="app-sr-only">（新标签打开）</span>}</a> : null;
      })}</nav> : null}
    </div>
    <footer className="about-footer"><span><i aria-hidden="true" />{profile.status}</span><span>honestman.me</span></footer>
  </section>;
}
