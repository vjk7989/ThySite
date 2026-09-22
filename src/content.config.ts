// https://docs.astro.build/en/guides/content-collections/#defining-collections

import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { glob } from 'astro/loaders';

const productsCollection = defineCollection({
  loader: glob({
    pattern: '**/[^_]*.{md,mdx}',
    base: './src/content/products',
  }),
  schema: () =>
    z.object({
      title: z.string(),
      description: z.string(),
      order: z.number(),
      action: z.string(),
      eyebrow: z.string(),
      summary: z.string(),
      diagram: z.enum(['hyper-tern', 'hyper-abs', 'hyper-0x', 'hyper-wallet']),
      secondary: z.boolean().default(false),
      capabilities: z.array(
        z.object({
          title: z.string(),
          body: z.string(),
        })
      ),
      flow: z.array(z.string()),
      boundaries: z.array(z.string()),
    }),
});

const blogCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      author: z.string(),
      pubDate: z.date(),
      cardImage: image(),
      cardImageAlt: z.string(),
      readTime: z.number(),
      tags: z.array(z.string()).optional(),
    }),
});

const insightsCollection = defineCollection({
  loader: glob({
    pattern: '**/[^_]*.{md,mdx}',
    base: './src/content/insights',
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      // contents: z.array(z.string()),
      cardImage: image(),
      cardImageAlt: z.string(),
    }),
});

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  products: productsCollection,
  blog: blogCollection,
  insights: insightsCollection,
};
