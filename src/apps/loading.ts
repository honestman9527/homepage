import { lazy, type ComponentType } from 'react';

/** A page-scoped lazy type; retry replaces React's cached rejection. */
export function createAppLoader<P extends object>(load: () => Promise<{ default: ComponentType<P> }>) {
  let content = lazy(load);
  return {
    get: () => content,
    retry: () => { content = lazy(load); },
  };
}
