const viteEnv = (import.meta as ImportMeta & { env?: { BASE_URL?: string } })
  .env;

const base = (viteEnv?.BASE_URL ?? '/ThySite/').replace(/\/$/, '');

/** Prefix an internal URL with Astro's configured deployment base. */
export function sitePath(path = '/'): string {
  if (path.startsWith('#') || /^[a-z]+:/i.test(path) || path.startsWith('//')) {
    return path;
  }

  const clean = path.startsWith('/') ? path : `/${path}`;
  if (!base) return clean;
  if (clean === base || clean.startsWith(`${base}/`)) return clean;
  return clean === '/' ? `${base}/` : `${base}${clean}`;
}

/** Remove Astro's deployment base before interpreting a request pathname. */
export function stripSiteBase(path: string): string {
  if (!base) return path;
  if (path === base) return '/';
  return path.startsWith(`${base}/`) ? path.slice(base.length) : path;
}
