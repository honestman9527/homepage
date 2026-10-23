import light from '../assets/brand/hm-light.svg';
import dark from '../assets/brand/hm-dark.svg';

export function Brand({ className = '' }: { className?: string }) {
  return <span className={`brand-mark ${className}`}><img className="brand-light" src={light} alt="" draggable="false" /><img className="brand-dark" src={dark} alt="" draggable="false" /></span>;
}
