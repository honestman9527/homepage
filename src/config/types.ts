export const appIds = ['about', 'projects', 'blog', 'terminal', 'settings'] as const;
export type AppId = (typeof appIds)[number];
export type IconName = 'user' | 'folder' | 'book' | 'terminal' | 'sliders';
export interface Size { width: number; height: number }
export interface AppDefinition {
  id: AppId;
  name: string;
  icon: IconName;
  aliases: readonly string[];
  keywords: readonly string[];
  defaultSize: Size;
  minSize: Size;
}

export type WallpaperId = 'dusk' | 'day' | 'night';
export interface WallpaperDefinition {
  id: WallpaperId;
  name: string;
  colors: readonly [string, string, string];
}

export interface PublicLink { label: string; url: string; kind?: 'web' | 'email' }
export interface Profile {
  name: string;
  alias: string;
  headline: string;
  introduction: string;
  description: string;
  interests: readonly string[];
  status: string;
  links: readonly PublicLink[];
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
  url?: string;
  sourceUrl?: string;
  image?: string;
}
export interface FeaturedPost {
  id: string;
  title: string;
  summary: string;
  url: string;
  date?: string;
  sample?: boolean;
}
export interface Blog {
  title: string;
  description: string;
  url?: string;
  posts: readonly FeaturedPost[];
}
export interface SiteConfig {
  site: { title: string; description: string; url?: string; shareImage?: string };
  profile: Profile;
  projects: readonly Project[];
  blog: Blog;
}
