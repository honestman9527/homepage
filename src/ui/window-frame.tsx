import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { appById, type AppId } from '../config/index.ts';
import { constrainWindowGeometry, getWindowPresentation, useDesktop, type Geometry } from '../desktop/index.ts';
import { Icon } from './icon.tsx';

interface Gesture { pointerId: number; x: number; y: number; base: Geometry; kind: 'move' | 'resize'; target: HTMLElement; restoreOnMove: boolean; started: boolean }
export function WindowFrame({ appId, children, onClose, onMinimize }: {
  appId: AppId; children: ReactNode; onClose(): void; onMinimize(): void;
}) {
  const desktop = useDesktop();
  const app = appById[appId];
  const record = desktop.state.windows[appId];
  const presentation = getWindowPresentation(desktop.state, appId);
  const gesture = useRef<Gesture | null>(null);
  const previewRef = useRef<Geometry | null>(null);
  const [preview, setPreview] = useState<Geometry | null>(null);
  const single = desktop.state.mode === 'single';
  function end(commit: boolean) {
    const current = gesture.current;
    if (!current) return;
    gesture.current = null;
    const final = previewRef.current;
    previewRef.current = null;
    setPreview(null);
    if (current.target.hasPointerCapture?.(current.pointerId)) current.target.releasePointerCapture(current.pointerId);
    if (commit && final && document.documentElement.dataset.compactViewport !== 'true') desktop.commitGeometry(appId, final);
  }
  useEffect(() => {
    // Layout/mode changes cancel an in-progress gesture without committing stale coordinates.
    const current = gesture.current;
    gesture.current = null;
    if (current?.target.hasPointerCapture?.(current.pointerId)) current.target.releasePointerCapture(current.pointerId);
    previewRef.current = null;
    setPreview(null);
  }, [desktop.state.viewport.width, desktop.state.viewport.height, single, presentation.visible]);
  useEffect(() => () => {
    const current = gesture.current;
    if (current?.target.hasPointerCapture?.(current.pointerId)) current.target.releasePointerCapture(current.pointerId);
    gesture.current = null;
  }, []);
  function begin(event: PointerEvent<HTMLElement>, kind: Gesture['kind']) {
    if (single || document.documentElement.dataset.compactViewport === 'true' || event.button !== 0 || (event.target as HTMLElement).closest('[data-window-controls]')) return;
    event.preventDefault();
    gesture.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, base: presentation.geometry, kind, target: event.currentTarget, restoreOnMove: record.maximized, started: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }
  function move(event: PointerEvent) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.started && Math.hypot(dx, dy) < 4) return;
    current.started = true;
    if (current.restoreOnMove) {
      const normal = record.normalGeometry;
      const fraction = Math.max(0, Math.min(1, (current.x - current.base.x) / current.base.width));
      current.base = constrainWindowGeometry(appId, { ...normal, x: current.x - normal.width * fraction, y: current.y - 24 }, desktop.state.viewport.availableArea);
      current.restoreOnMove = false;
      desktop.toggleMaximize(appId);
    }
    const next = constrainWindowGeometry(appId, current.kind === 'move'
      ? { ...current.base, x: current.base.x + dx, y: current.base.y + dy }
      : { ...current.base, width: current.base.width + dx, height: current.base.height + dy }, desktop.state.viewport.availableArea);
    previewRef.current = next;
    setPreview(next);
  }
  const geometry = preview ?? presentation.geometry;
  const style = { left: geometry.x, top: geometry.y, width: geometry.width, height: geometry.height, zIndex: presentation.zIndex } as CSSProperties;
  return <section className={`app-window ${appId === 'terminal' ? 'terminal-frame' : ''} ${presentation.active ? 'active-window' : ''} ${single ? 'single-window' : ''}`} style={style} role="region" aria-label={app.name} data-app-window={appId} hidden={!presentation.visible} inert={!presentation.visible} tabIndex={-1}
    onPointerDown={event => { if (!(event.target as HTMLElement).closest('[data-window-controls]')) desktop.focus(appId); }}
    onFocusCapture={event => { if (!presentation.active && !(event.target as HTMLElement).closest('[data-window-controls]')) desktop.focus(appId); }}
    onPointerMove={move} onPointerUp={event => { if (event.pointerId === gesture.current?.pointerId) end(true); }} onPointerCancel={() => end(false)} onLostPointerCapture={() => end(false)}>
    <header role="presentation" className="window-titlebar" onPointerDown={event => begin(event, 'move')} onDoubleClick={event => { if (!single && document.documentElement.dataset.compactViewport !== 'true' && !(event.target as HTMLElement).closest('[data-window-controls]')) desktop.toggleMaximize(appId); }}>
      <div className="window-controls" data-window-controls onPointerDown={event => { if (!presentation.active) event.preventDefault(); }}>
        <button className="window-close" onClick={onClose} aria-label={`关闭${app.name}`}><span aria-hidden="true">×</span></button>
        {!single && <><button className="window-minimize" onClick={onMinimize} aria-label={`最小化${app.name}`}><span aria-hidden="true">−</span></button><button className="window-maximize" onClick={() => { if (document.documentElement.dataset.compactViewport !== 'true') desktop.toggleMaximize(appId); }} aria-label={`${record.maximized ? '还原' : '最大化'}${app.name}`}><span aria-hidden="true">{record.maximized ? '↙' : '+'}</span></button></>}
      </div>
      <span className="window-title"><Icon name={app.icon} />{app.name}</span><span className="window-chrome-note" aria-hidden="true">{appId === 'terminal' ? '~/honestman' : 'HonestOS'}</span>
    </header>
    <div className="window-content">{children}</div>
    {!single && !record.maximized && <button className="window-resize" aria-label={`调整${app.name}大小`} onPointerDown={event => begin(event, 'resize')} onKeyDown={event => {
      const delta = event.shiftKey ? 40 : 10;
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      desktop.commitGeometry(appId, { ...record.normalGeometry, width: record.normalGeometry.width + (event.key === 'ArrowRight' ? delta : event.key === 'ArrowLeft' ? -delta : 0), height: record.normalGeometry.height + (event.key === 'ArrowDown' ? delta : event.key === 'ArrowUp' ? -delta : 0) });
    }}><Icon name="resize" /></button>}
  </section>;
}
