import { useEffect, useState } from 'react';
import { publicUrl, type Blog } from '../../../config/index.ts';
import { Icon } from '../../../shared/components/Icon.tsx';
import { loadBlogFeed, type BlogPost } from '../model/feed.ts';

type FeedState =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; posts: BlogPost[] };

function BlogArticles({ rssUrl }: { rssUrl: string }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<FeedState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    setState({ status: 'loading' });
    void loadBlogFeed(rssUrl, controller.signal)
      .then((posts) => {
        if (!disposed) setState({ status: 'ready', posts });
      })
      .catch(() => {
        if (!disposed) setState({ status: 'error' });
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [rssUrl, attempt]);

  if (state.status === 'loading') return <p role="status">正在加载文章…</p>;
  if (state.status === 'error') {
    return (
      <div>
        <p role="alert">文章加载失败，请重试或直接访问独立博客。</p>
        <button
          className="app-button"
          type="button"
          onClick={() => setAttempt((value) => value + 1)}
        >
          重新加载文章
        </button>
      </div>
    );
  }
  if (!state.posts.length) return <p className="blog-empty">暂时没有文章，可以先去博客逛逛。</p>;

  return (
    <section className="blog-featured" aria-label="最新文章">
      <ul>
        {state.posts.map((post) => (
          <li key={post.url}>
            <a href={post.url} target="_blank" rel="noopener noreferrer">
              <h3>{post.title}</h3>
              <span className="app-sr-only">（新标签打开）</span>
            </a>
            {post.summary ? <p className="app-muted">{post.summary}</p> : null}
            {post.date ? (
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  timeZone: 'UTC',
                })}
              </time>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BlogApp({ blog }: { blog: Blog }) {
  const url = publicUrl(blog.url);
  const rssUrl = publicUrl(blog.rssUrl);
  return (
    <section className="app-content blog-content app-padded">
      <div className="blog-heading">
        <Icon name="book" />
        <div>
          <h2>{blog.title}</h2>
          <small>生活、代码与偶尔的灵感</small>
        </div>
      </div>
      <p className="app-muted blog-description">{blog.description}</p>
      <div className="blog-introduction">
        {url ? (
          <a className="app-button" href={url} target="_blank" rel="noopener noreferrer">
            打开独立博客<span className="app-sr-only">（新标签打开）</span>
          </a>
        ) : (
          <p>独立博客筹备中</p>
        )}
      </div>
      {rssUrl ? (
        <BlogArticles key={rssUrl} rssUrl={rssUrl} />
      ) : url ? (
        <p className="blog-empty">暂未配置文章订阅，可以先去博客逛逛。</p>
      ) : null}
    </section>
  );
}
