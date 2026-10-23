import { profileLinks, publicUrl, siteConfig, type AppId } from '../config/index.ts';
import { ProjectsApp } from './projects';
import { BlogApp } from './blog';
import { SettingsApp } from './settings';
import { TerminalApp } from './terminal';
import './apps.css';

export interface AppContentProps {
  appId: AppId;
  onOpen: (appId: AppId, options?: { focusTerminal?: boolean }) => void;
  onArrange: () => void;
}

export function AppContent({ appId, onOpen, onArrange }: AppContentProps) {
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
        return url ? <a key={link.label} href={url} target="_blank" rel="noopener noreferrer">{link.label}<span className="app-sr-only">（新标签打开）</span></a> : null;
      })}</nav> : null}
    </div>
    <footer className="about-footer"><span><i aria-hidden="true" />{profile.status}</span><span>honestman.me</span></footer>
  </section>;
}
