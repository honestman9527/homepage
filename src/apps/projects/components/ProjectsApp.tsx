import { useEffect, useRef, useState } from 'react';
import { Brand } from '../../../shared/components/Brand.tsx';
import { publicUrl, type AppId, type Project, type ProjectStatus } from '../../../config/index.ts';

const statusNames: Record<ProjectStatus, string> = {
  live: '已上线',
  building: '开发中',
  idea: '构想中',
  archived: '归档',
};

function ProjectArt({ project }: { project: Project }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  if (project.image && failedImage !== project.image)
    return (
      <div className="project-art">
        <img
          src={project.image}
          alt={`${project.name} 项目预览`}
          loading="lazy"
          onError={() => setFailedImage(project.image!)}
        />
      </div>
    );
  return (
    <div className={`project-art project-art-${project.id}`} aria-hidden="true">
      {project.id === 'honestos' ? (
        <Brand className="project-monogram" />
      ) : (
        <span className="project-initial">{Array.from(project.name)[0]}</span>
      )}
    </div>
  );
}

function ProjectLinks({ project }: { project: Project }) {
  const online =
    !project.currentSite && project.status !== 'idea' ? publicUrl(project.url) : undefined;
  const source = publicUrl(project.sourceUrl);
  const article = publicUrl(project.articleUrl);
  return online || source || article ? (
    <nav className="project-links" aria-label={`${project.name}链接`}>
      {online ? (
        <a className="project-link-online" href={online} target="_blank" rel="noopener noreferrer">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M14 3h7v7m0-7L11 13M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
          </svg>
          在线访问<span className="app-sr-only">（新标签打开）</span>
        </a>
      ) : null}
      {source ? (
        <a href={source} target="_blank" rel="noopener noreferrer">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18" />
          </svg>
          查看源码<span className="app-sr-only">（新标签打开）</span>
        </a>
      ) : null}
      {article ? (
        <a href={article} target="_blank" rel="noopener noreferrer">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M8 13h8m-8 4h5" />
          </svg>
          项目介绍<span className="app-sr-only">（新标签打开）</span>
        </a>
      ) : null}
    </nav>
  ) : null;
}

function ProjectIdentity({ project }: { project: Project }) {
  return (
    <div className="project-badges">
      <span className={`project-status status-${project.status}`}>
        {statusNames[project.status]}
      </span>
      {project.currentSite ? <span className="project-site-badge">本站</span> : null}
      {project.year ? <span className="project-year-badge">{project.year}</span> : null}
    </div>
  );
}

export function ProjectsApp({
  projects,
  onOpen,
}: {
  projects: readonly Project[];
  onOpen: (appId: AppId) => void;
}) {
  const scroller = useRef<HTMLElement>(null);
  const readingTop = useRef(0);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    const restore = () => {
      if (node.clientHeight > 0) node.scrollTop = readingTop.current;
    };
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(restore) : null;
    observer?.observe(node);
    window.addEventListener('resize', restore);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', restore);
    };
  }, []);

  return (
    <section
      ref={scroller}
      aria-label="项目内容"
      className="app-content projects-content app-padded"
      onScroll={(event) => {
        if (event.currentTarget.clientHeight > 0)
          readingTop.current = event.currentTarget.scrollTop;
      }}
    >
      <h2>我的项目</h2>
      {projects.length ? (
        <div className="project-list">
          {projects.map((project, index) => (
            <article
              className="project-card"
              key={project.id}
              aria-labelledby={`project-${project.id}`}
              style={{ '--stagger-index': index } as React.CSSProperties}
            >
              <ProjectArt project={project} />
              <div className="project-card-copy">
                <h3 id={`project-${project.id}`}>{project.name}</h3>
                <ProjectIdentity project={project} />
                {project.summary?.trim() ? <p className="app-muted">{project.summary}</p> : null}
              </div>
              <ProjectLinks project={project} />
            </article>
          ))}
        </div>
      ) : (
        <div className="app-empty">
          <p>项目正在整理中，稍后再来看看。</p>
          <button className="app-button" onClick={() => onOpen('about')}>
            先认识一下我
          </button>
        </div>
      )}
    </section>
  );
}
