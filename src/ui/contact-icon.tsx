import github from 'simple-icons/icons/github.svg?url&no-inline';
import gitlab from 'simple-icons/icons/gitlab.svg?url&no-inline';
import x from 'simple-icons/icons/x.svg?url&no-inline';
import bluesky from 'simple-icons/icons/bluesky.svg?url&no-inline';
import mastodon from 'simple-icons/icons/mastodon.svg?url&no-inline';
import telegram from 'simple-icons/icons/telegram.svg?url&no-inline';
import bilibili from 'simple-icons/icons/bilibili.svg?url&no-inline';
import youtube from 'simple-icons/icons/youtube.svg?url&no-inline';
import zhihu from 'simple-icons/icons/zhihu.svg?url&no-inline';
import discord from 'simple-icons/icons/discord.svg?url&no-inline';
import type { ContactIconName, SocialIconName } from '../config/index.ts';

// File imports avoid prebundling the icon catalog during development.
const logos: Record<SocialIconName, string> = { github, gitlab, x, bluesky, mastodon, telegram, bilibili, youtube, zhihu, discord };

export function ContactIcon({ name = 'link' }: { name?: ContactIconName }) {
  if (name !== 'email' && name !== 'link') {
    const maskImage = `url("${logos[name]}")`;
    return <span className="contact-icon contact-brand" style={{ maskImage, WebkitMaskImage: maskImage }} aria-hidden="true" />;
  }
  return <svg className="contact-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {name === 'email' ? <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></g>
      : <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m10 13 4-4m-5 7-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 0 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" /></g>}
  </svg>;
}
