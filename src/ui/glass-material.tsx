import { useId, type CSSProperties } from 'react';
import edgeMap from '../assets/glass-edge-map.png';
import './glass-material.css';

/** Decorative only: backdrop treatment never filters the surface's controls or text. */
export function GlassMaterial() {
  const id = `glass-${useId().replaceAll(':', '')}`;
  return (
    <span
      className="glass-material"
      aria-hidden="true"
      style={{ '--glass-refraction': `url("#${id}")` } as CSSProperties}
    >
      <svg className="glass-definitions" aria-hidden="true" focusable="false">
        <defs>
          <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feImage
              href={edgeMap}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="edge-map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="edge-map"
              scale="3.2"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <span className="glass-edge" />
      <span className="glass-specular" />
    </span>
  );
}
