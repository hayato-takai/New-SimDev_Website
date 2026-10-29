import { getCollection, type CollectionEntry } from 'astro:content';

export type CaseStudy = CollectionEntry<'caseStudies'>;
export type CaseStudyResults = CaseStudy['data']['results'];
export type Comparison = CaseStudyResults['oilVolume'];

/** The banner cards: each result's key and its label, in display order. */
export const RESULT_CARDS: { key: keyof CaseStudyResults; label: string }[] = [
  { key: 'oilVolume', label: 'Oil volume' },
  { key: 'tankWeight', label: 'Tank weight' },
  { key: 'oilCost', label: 'Oil cost per fill' },
  { key: 'co2', label: 'CO₂ per oil fill' }
];

const newestFirst = (a: CaseStudy, b: CaseStudy) => b.data.date.valueOf() - a.data.date.valueOf();

/** Every case study, drafts included: each gets a page, linked or not. */
export async function getAllCaseStudies(): Promise<CaseStudy[]> {
  return (await getCollection('caseStudies')).sort(newestFirst);
}

/** Published case studies (draft: false), newest first: the overview page. */
export async function getPublishedCaseStudies(): Promise<CaseStudy[]> {
  return (await getCollection('caseStudies', ({ data }) => !data.draft)).sort(newestFirst);
}

/** Drafts, newest first: listed only on /case-studies/admin. */
export async function getDraftCaseStudies(): Promise<CaseStudy[]> {
  return (await getCollection('caseStudies', ({ data }) => data.draft)).sort(newestFirst);
}

/** "October 2026" */
export function formatProjectDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** A value with its unit: "120 L", "€240". */
export function formatValue(result: Comparison, value: number): string {
  const number = value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return `${result.prefix ?? ''}${number}${result.unit ? ` ${result.unit}` : ''}`;
}

/** The concept's change from the baseline: the entry's own wording, or the percentage. */
export function resultChange(result: Comparison): string | undefined {
  if (result.change) return result.change;
  if (result.baseline === 0) return undefined;
  const percent = Math.round(((result.concept - result.baseline) / result.baseline) * 100);
  if (percent === 0) return 'No change';
  return `${percent < 0 ? '−' : '+'}${Math.abs(percent)}%`;
}
