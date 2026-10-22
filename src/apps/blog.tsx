import { publicUrl, type Blog } from '../config/index.ts';

export function BlogApp({ blog }: { blog: Blog }) {
  const url = publicUrl(blog.url);
  const posts = blog.posts.filter(post => !post.sample && publicUrl(post.url));
  return <section className="app-content blog-content app-padded">
    <div className="blog-paper-mark" aria-hidden="true">✎</div>
    <h2>{blog.title}</h2>
    <p className="app-muted blog-description">{blog.description}</p>
    <div className="blog-introduction">
      <p>生活、代码，还有路上碰到的好奇心，都慢慢写在独立博客里。</p>
      {url ? <a className="app-button app-primary" href={url} target="_blank" rel="noopener noreferrer">打开独立博客<span className="app-sr-only">（新标签打开）</span></a>
        : <p className="blog-coming-soon">独立博客筹备中</p>}
    </div>
    {posts.length ? <section className="blog-featured" aria-label="精选文章"><h3>最近想分享的</h3><ul>{posts.map(post => <li key={post.id}>
      <a href={publicUrl(post.url)} target="_blank" rel="noopener noreferrer"><h3>{post.title}</h3><span className="app-sr-only">（新标签打开）</span></a>
      <p className="app-muted">{post.summary}</p>
      {post.date ? <time dateTime={post.date}>{post.date}</time> : null}
    </li>)}</ul></section> : null}
  </section>;
}
