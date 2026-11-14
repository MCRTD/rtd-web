import { marked } from 'marked';
import { getTerms } from '#lib/api.js';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  const terms = await getTerms(fetch);
  const html = await marked.parse(terms.content, { gfm: true });
  return { html, version: terms.version };
};
