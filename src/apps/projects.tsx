import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Brand } from '../ui/brand.tsx';
import { publicUrl, type AppId, type Project, type ProjectStatus } from '../config/index.ts';

const statusNames: Record<ProjectStatus, string> = { live: '已上线', building: '开发中', idea: '构想中', archived: '归档' };

function ProjectArt({ project }: { project: Project }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  if (project.image && failedImage !== project.image) return <div className="project-art"><img src={project.image} alt={`${project.name} 项目预览`} loading="lazy" onError={() => setFailedImage(project.image!)} /></div>;
  return <div className={`project-art project-art-${project.id}`} aria-hidden="true">
    {project.id === 'honestos' ? <Brand className="project-monogram" />
      : project.id === 'universe' ? <><span className="project-orbit" /><span className="project-orbit orbit-two" /><span className="project-orbit orbit-three" /><span className="project-orb" /></>
      : <><span className="project-grid" /><span className="project-lab-mark">{'{ ? }'}</span></>}
  </div>;
}

function ProjectLinks({ project }: { project: Project }) {
  const online = !project.currentSite && project.status !== 'idea' ? publicUrl(project.url) : undefined;
  const source = publicUrl(project.sourceUrl);
  return online || source ? <nav className="project-links" aria-label={`${project.name}链接`}>
    {online ? <a href={online} target="_blank" rel="noopener noreferrer">在线访问<span className="app-sr-only">（新标签打开）</span></a> : null}
    {source ? <a href={source} target="_blank" rel="noopener noreferrer">查看源码<span className="app-sr-only">（新标签打开）</span></a> : null}
  </nav> : null;
}

function ProjectIdentity({ project }: { project: Project }) {
  return <div className="project-badges"><span className={`project-status status-${project.status}`}>{statusNames[project.status]}</span>{project.currentSite ? <span className="project-site-badge">本站</span> : null}</div>;
}

export function ProjectsApp({ projects, onOpen }: { projects: readonly Project[]; onOpen: (appId: AppId) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = projects.find(project => project.id === selectedId);
  const scroller = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const actions = useRef(new Map<string, HTMLButtonElement>());
  const returnTarget = useRef<{ id: string; top: number } | null>(null);
  const readingTop = useRef(0);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    const restore = () => { if (node.clientHeight > 0) node.scrollTop = readingTop.current; };
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(restore) : null;
    observer?.observe(node);
    window.addEventListener('resize', restore);
    return () => { observer?.disconnect(); window.removeEventListener('resize', restore); };
  }, []);

  useLayoutEffect(() => {
    if (!scroller.current) return;
    if (selected) {
      scroller.current.scrollTop = 0;
      readingTop.current = 0;
      detailHeading.current?.focus({ preventScroll: true });
    } else if (returnTarget.current) {
      scroller.current.scrollTop = returnTarget.current.top;
      readingTop.current = returnTarget.current.top;
      (actions.current.get(returnTarget.current.id) ?? heading.current)?.focus({ preventScroll: true });
      returnTarget.current = null;
    }
  }, [selected?.id]);

  function showDetail(project: Project) {
    returnTarget.current = { id: project.id, top: scroller.current?.scrollTop ?? 0 };
    setSelectedId(project.id);
  }

  return <section ref={scroller} aria-label="项目内容" className="app-content projects-content app-padded" onScroll={event => {
    if (event.currentTarget.clientHeight > 0) readingTop.current = event.currentTarget.scrollTop;
  }}>
    {selected ? <>
      <button className="app-button project-back" onClick={() => setSelectedId(null)}>返回项目列表</button>
      <ProjectArt project={selected} />
      <h2 ref={detailHeading} tabIndex={-1}>{selected.name}</h2>
      <ProjectIdentity project={selected} />
      <p className="project-detail-summary">{selected.summary}</p>
      <p>{selected.description}</p>
      <ul className="project-tags">{selected.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
      <ProjectLinks project={selected} />
    </> : <>
      <h2 ref={heading} tabIndex={-1}>我的项目</h2>
      <p className="app-muted">把好奇心变成小东西，也为还在酝酿的想法留个位置。</p>
      {projects.length ? <div className="project-list">{projects.map(project => <article className="project-card" key={project.id}>
        <ProjectArt project={project} />
        <div className="project-card-copy">
          <h3>{project.name}</h3>
          <ProjectIdentity project={project} />
          <p className="app-muted">{project.summary}</p>
          <ul className="project-tags">{project.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
          <button className="app-button project-detail-action" ref={element => { if (element) actions.current.set(project.id, element); else actions.current.delete(project.id); }} onClick={() => showDetail(project)} aria-label={`了解${project.name}`}>了解项目</button>
          <ProjectLinks project={project} />
        </div>
      </article>)}</div> : <div className="app-empty"><p>项目正在整理中，稍后再来看看。</p><button className="app-button" onClick={() => onOpen('about')}>先认识一下我</button></div>}
    </>}
  </section>;
}
