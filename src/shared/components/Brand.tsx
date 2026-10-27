export function Brand({ className = '' }: { className?: string }) {
  return (
    <span className={`brand-mark ${className}`}>
      <img className="brand-light" src="/hm-light.svg" alt="" draggable="false" />
      <img className="brand-dark" src="/hm-dark.svg" alt="" draggable="false" />
    </span>
  );
}
