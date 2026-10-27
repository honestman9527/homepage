import { appRegistry } from '../../config/index.ts';

export function searchApps(query: string) {
  const needle = query.trim().toLocaleLowerCase();
  return appRegistry.filter((app) =>
    [app.id, app.name, ...app.aliases, ...app.keywords].some((text) =>
      text.toLocaleLowerCase().includes(needle),
    ),
  );
}
