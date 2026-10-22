import type { IconName } from '../config/index.ts';

export function Icon({ name }: { name: IconName | 'search' | 'resize' }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {name === 'user' && <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>}
    {name === 'folder' && <path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 2h18" />}
    {name === 'book' && <path d="M12 5v16M12 5C8 2 4 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-2-1-6-2-10 1Z" />}
    {name === 'terminal' && <path d="m5 6 6 6-6 6M13 18h6" />}
    {name === 'sliders' && <path d="M5 3v6m0 4v8m7-18v12m0 4v2m7-18v3m0 4v11M2 9h6m1 10h6m1-13h6" />}
    {name === 'search' && <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>}
    {name === 'resize' && <path d="m9 19 10-10m-4 10 4-4" />}
  </svg>;
}
