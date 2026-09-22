/**
 * Navigation structure shared by every locale: stable ids, unlocalised paths
 * and social URLs. The label for each id lives in the copy tables
 * (`copy.nav.labels`, `copy.nav.footer.sections`), so translators never touch
 * a path and code never keys on a translated label.
 */
export type NavLinkId = 'home' | 'products' | 'services' | 'blog';

export const navLinks: { id: NavLinkId; path: string }[] = [
  { id: 'home', path: '/' },
  { id: 'products', path: '/products' },
  { id: 'services', path: '/services' },
  { id: 'blog', path: '/blog' },
];

export const socialLinks = {
  github: 'https://github.com/vjk7989/ThySite',
};
