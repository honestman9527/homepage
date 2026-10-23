import { publicUrl, type Blog } from '../config/index.ts';
import { Icon } from '../ui/icon.tsx';

export function BlogApp({ blog }: { blog: Blog }) {
  const url = publicUrl(blog.url);
  const posts = blog.posts.filter(post => !post.sample && publicUrl(post.url));
  return <section className="app-content blog-content app-padded">
    <div className="blog-heading"><Icon name="book" /><div><h2>{blog.title}</h2><small>生活、代码与偶尔的灵感</small></div></div>
    <p className="app-muted blog-description">{blog.description}</p>
    <div className="blog-introduction">{url ? <a className="app-button" href={url} target="_blank" rel="noopener noreferrer">打开独立博客<span className="app-sr-only">（新标签打开）</span></a> : <p>独立博客筹备中</p>}</div>
    {posts.length ? <section className="blog-featured" aria-label="精选文章"><ul>{posts.map(post => <li key={post.id}>
      <a href={publicUrl(post.url)} target="_blank" rel="noopener noreferrer"><h3>{post.title}</h3><span className="app-sr-only">（新标签打开）</span></a>
      {post.summary ? <p className="app-muted">{post.summary}</p> : null}
      {post.date ? <time dateTime={post.date}>{new Date(post.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}</time> : null}
    </li>)}</ul></section> : url ? <p className="blog-empty">精选文章正在整理中，可以先去博客逛逛。</p> : null}
  </section>;
}
