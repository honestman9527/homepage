import type { AppId } from './registry.ts';
import type { ContactIconName } from './social-links.ts';

export type IconName = 'user' | 'folder' | 'book' | 'terminal' | 'sliders';
export interface Size {
  width: number;
  height: number;
}
export interface AppDefinition<Id extends string = AppId> {
  id: Id;
  name: string;
  icon: IconName;
  aliases: readonly string[];
  keywords: readonly string[];
  defaultSize: Size;
  minSize: Size;
}

export type WallpaperId = 'dusk' | 'day' | 'night' | 'lake' | 'summit';
export interface WallpaperDefinition {
  id: WallpaperId;
  name: string;
  colors: readonly [string, string, string];
  image?: string;
}

export interface PublicLink {
  label: string;
  url: string;
  kind?: 'web' | 'email';
  icon?: ContactIconName;
}
export interface ProfileHighlight {
  label: string;
  value: string;
}
export interface Profile {
  name: string;
  alias: string;
  avatar?: string;
  role?: string;
  headline: string;
  introduction: string;
  description: string;
  interests: readonly string[];
  highlights?: readonly ProfileHighlight[];
  status: string;
  links: readonly (PublicLink | string)[];
}
export type ProjectStatus = 'live' | 'building' | 'idea' | 'archived';
export interface Project {
  id: string;
  name: string;
  summary: string;
  description: string;
  status: ProjectStatus;
  currentSite?: boolean;
  tags: readonly string[];
  stack?: readonly string[];
  highlights?: readonly string[];
  year?: string;
  url?: string;
  sourceUrl?: string;
  image?: string;
}
export interface Blog {
  title: string;
  description: string;
  url?: string;
  rssUrl?: string;
}
export interface BootStage {
  progress: number;
  label: string;
}
export interface BootConfig {
  enabled: boolean;
  durationMs: number;
  subtitle: string;
  stages: readonly BootStage[];
}
export interface DesktopShortcutConfig {
  appId: AppId;
  label?: string;
  glyph?: string;
}
export interface SystemConfig {
  boot: BootConfig;
  shortcuts: readonly DesktopShortcutConfig[];
}
export interface SiteConfig {
  site: { title: string; description: string; url?: string; shareImage?: string };
  profile: Profile;
  projects: readonly Project[];
  blog: Blog;
  system: SystemConfig;
}
