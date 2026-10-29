import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** The Air-X return filters a project can name; see src/lib/airx.ts. */
export const AIR_X_MODELS = ['RFB Compact', 'RFB', 'RFT Compact', 'RFT'] as const;

/**
 * Filter optimization case studies, one Markdown file each in
 * src/content/case-studies/. Copy _template.md to start a new one — files
 * whose name starts with "_" are skipped, so the template never becomes a page.
 */
const caseStudies = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/case-studies' }),
  schema: ({ image }) => {
    const imageWithAlt = z.object({
      src: image(),
      alt: z.string()
    });

    // One measured result, baseline tank vs. concept tank. Plain numbers so
    // they can be drawn to scale; `unit` goes after the number ("120 L"),
    // `prefix` before it ("€240"). `change` replaces the computed percentage.
    const comparison = z.object({
      baseline: z.number().nonnegative(),
      concept: z.number().nonnegative(),
      unit: z.string().optional(),
      prefix: z.string().optional(),
      change: z.string().optional()
    });

    return z.object({
      title: z.string(),
      summary: z.string(),
      date: z.coerce.date(),
      // Drafts are hidden from /case-studies and listed only on the unlinked
      // /case-studies/admin; they still get a page, reachable by its link.
      draft: z.boolean().default(false),

      customer: z.string().default('Confidential'),
      industry: z.string(),
      application: z.string(),
      filter: z.enum(AIR_X_MODELS).optional(),
      scope: z.array(z.string()).default([]),

      // The case study's preview: the overview card's image and the banner's.
      // A placeholder shows until one is added.
      preview: imageWithAlt.optional(),

      // The baseline tank and the concept tank, shown side by side. A missing
      // image shows as a placeholder until one is added.
      images: z
        .object({
          baseline: imageWithAlt.optional(),
          concept: imageWithAlt.optional()
        })
        .default({}),

      // The one result that leads the card on the overview page.
      headline: z.object({
        value: z.string(),
        label: z.string()
      }),

      // The banner cards, in this order. Oil volume is required: it is also
      // the bar in the baseline vs. concept section.
      results: z.object({
        oilVolume: comparison,
        tankWeight: comparison.optional(),
        oilCost: comparison.optional(),
        co2: comparison.optional()
      })
    });
  }
});

/**
 * The tool READMEs, rendered as pages under /helpers/documentation/ when the
 * site builds. They stay in public/scripts/<tool>/ beside the scripts they
 * describe; the folder name is the page address.
 */
const docs = defineCollection({
  loader: glob({
    pattern: '*/README.md',
    base: './public/scripts',
    generateId: ({ entry }) => entry.split('/')[0]
  })
});

export const collections = { caseStudies, docs };
