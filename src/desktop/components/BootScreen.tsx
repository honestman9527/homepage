import { useEffect, useState, type CSSProperties } from 'react';
import { siteConfig } from '../../config/index.ts';
import { useReducedMotion } from '../../preferences/index.ts';
import { GlassMaterial } from '../../shared/components/GlassMaterial.tsx';
import '../styles/boot-screen.css';

export function BootScreen({ forceVisible = false }: { forceVisible?: boolean }) {
  const reducedMotion = useReducedMotion();
  const { boot } = siteConfig.system;
  const profile = siteConfig.profile;
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'leaving' | 'done'>(() =>
    (!boot.enabled || reducedMotion) && !forceVisible ? 'done' : 'loading',
  );

  useEffect(() => {
    if ((!boot.enabled || reducedMotion) && !forceVisible) {
      setPhase('done');
      return;
    }
    if (phase === 'done') return;

    const duration = Math.max(240, boot.durationMs);
    const start = performance.now();
    let frame = 0;
    let leaveTimer: ReturnType<typeof setTimeout> | undefined;

    const tick = (now: number) => {
      const elapsed = Math.max(0, now - start);
      const ratio = Math.min(1, elapsed / duration);
      // Smooth cubic ease-out curve for the progress counter
      const eased = 1 - Math.pow(1 - ratio, 3);
      setProgress(Math.round(eased * 100));
      if (ratio < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setPhase('leaving');
        leaveTimer = setTimeout(() => setPhase('done'), 320);
      }
    };

    frame = requestAnimationFrame(tick);

    const skip = () => {
      cancelAnimationFrame(frame);
      clearTimeout(leaveTimer);
      setProgress(100);
      setPhase('done');
    };

    window.addEventListener('pointerdown', skip, { once: true, passive: true });
    window.addEventListener('keydown', skip, { once: true, passive: true });

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(leaveTimer);
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
    };
  }, [boot.durationMs, boot.enabled, forceVisible, phase, reducedMotion]);

  if (phase === 'done') return null;

  const currentStage =
    [...boot.stages].reverse().find((stage) => progress >= stage.progress) ?? boot.stages[0];

  return (
    <div
      className={`boot-splash ${phase === 'leaving' ? 'is-leaving' : ''}`}
      data-boot-splash={phase}
      aria-hidden="true"
      style={
        {
          '--boot-progress': `${progress}%`,
          '--boot-duration': `${boot.durationMs}ms`,
        } as CSSProperties
      }
    >
      <div className="boot-card">
        <GlassMaterial />
        <div className="boot-avatar-shell">
          <span className="boot-avatar-halo" />
          <span className="boot-avatar-ring" />
          <img
            className="boot-avatar-image"
            src={profile.avatar ?? '/avatar.webp'}
            alt=""
            draggable="false"
          />
          <span className="boot-avatar-status" />
        </div>
        <div className="boot-identity">
          <strong className="boot-user-name">{profile.name}</strong>
          <span className="boot-user-subtitle">
            {profile.alias} · {boot.subtitle}
          </span>
        </div>
        <div className="boot-progress-wrap" data-boot-progress={progress}>
          <div className="boot-progress-track">
            <span className="boot-progress-fill" />
            <span className="boot-progress-glint" />
          </div>
          <div className="boot-progress-meta">
            <span className="boot-stage-label">{currentStage?.label ?? '正在启动…'}</span>
            <span className="boot-stage-percent">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
