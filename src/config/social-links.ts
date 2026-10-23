// Exact host matching avoids assigning a brand to unrelated look-alike domains.
export const socialBrands = [
  { id: 'github', label: 'GitHub', hosts: ['github.com', 'gist.github.com'] },
  { id: 'gitlab', label: 'GitLab', hosts: ['gitlab.com'] },
  { id: 'x', label: 'X', hosts: ['x.com', 'twitter.com'] },
  { id: 'bluesky', label: 'Bluesky', hosts: ['bsky.app'] },
  { id: 'mastodon', label: 'Mastodon', hosts: ['mastodon.social'] },
  { id: 'telegram', label: 'Telegram', hosts: ['t.me', 'telegram.me'] },
  { id: 'bilibili', label: '哔哩哔哩', hosts: ['bilibili.com', 'space.bilibili.com'] },
  { id: 'youtube', label: 'YouTube', hosts: ['youtube.com', 'youtu.be'] },
  { id: 'zhihu', label: '知乎', hosts: ['zhihu.com'] },
  { id: 'discord', label: 'Discord', hosts: ['discord.com', 'discord.gg'] },
] as const;

export type SocialIconName = (typeof socialBrands)[number]['id'];
export type ContactIconName = SocialIconName | 'email' | 'link';

export function socialBrand(hostname: string) {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  return socialBrands.find((brand) => (brand.hosts as readonly string[]).includes(host));
}

export function isContactIcon(value: unknown): value is ContactIconName {
  return value === 'email' || value === 'link' || socialBrands.some((brand) => brand.id === value);
}
