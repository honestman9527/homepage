import { publicUrl } from '../../../config/index.ts';

export interface BlogPost {
  title: string;
  summary: string;
  url: string;
  date?: string;
}

function text(element: Element, name: string): string {
  return element.querySelector(`:scope > ${name}`)?.textContent?.trim() ?? '';
}

function summaryText(html: string): string {
  const document = new DOMParser().parseFromString(html, 'text/html');
  document
    .querySelectorAll('script, style, iframe, object, template')
    .forEach((node) => node.remove());
  const summary = (document.body.textContent ?? '').replace(/\s+/g, ' ').trim();
  return summary.length > 240 ? `${summary.slice(0, 240)}…` : summary;
}

/** Read RSS metadata only; remote markup is never inserted into the application DOM. */
export function parseBlogFeed(xml: string, feedUrl: string): BlogPost[] {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  const channel = document.querySelector('rss > channel');
  if (document.querySelector('parsererror') || !channel) throw new Error('Invalid RSS feed');

  const seen = new Set<string>();
  return Array.from(channel.querySelectorAll(':scope > item')).flatMap((item) => {
    const title = text(item, 'title');
    const link = text(item, 'link');
    let url: string | undefined;
    try {
      url = link ? publicUrl(new URL(link, feedUrl).href) : undefined;
    } catch {
      return [];
    }
    if (!title || !url || seen.has(url)) return [];
    seen.add(url);
    const date = new Date(text(item, 'pubDate'));
    return [
      {
        title,
        url,
        summary: summaryText(text(item, 'description')),
        date: Number.isNaN(date.getTime()) ? undefined : date.toISOString(),
      },
    ];
  });
}

export async function loadBlogFeed(url: string, signal: AbortSignal): Promise<BlogPost[]> {
  const response = await fetch(url, {
    signal,
    mode: 'cors',
    credentials: 'omit',
    headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
  });
  if (!response.ok) throw new Error(`RSS request failed: ${response.status}`);
  return parseBlogFeed(await response.text(), response.url || url);
}
