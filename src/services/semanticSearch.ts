import type { VirtualFile } from '../types/desktop';

export interface SemanticFileMatch {
  file: VirtualFile;
  score: number;
  snippet: string;
  matchedConcepts: string[];
}

const CONCEPTS: Record<string, string[]> = {
  agriculture: ['agriculture', 'agricultural', 'farm', 'farming', 'crop', 'crops', 'krishimitra', 'kisan'],
  disease: ['disease', 'illness', 'infection', 'pathology', 'pathogen', 'symptom'],
  detection: ['detect', 'detection', 'identify', 'identification', 'recognize', 'recognition', 'diagnose', 'diagnosis', 'classification', 'classify'],
  model: ['model', 'algorithm', 'classifier', 'machine', 'learning', 'neural', 'network', 'ai'],
  presentation: ['presentation', 'present', 'slide', 'slides', 'deck', 'powerpoint', 'keynote', 'talk'],
  image: ['image', 'photo', 'picture', 'screenshot', 'scan', 'visual'],
  note: ['note', 'notes', 'memo', 'meeting', 'minutes', 'summary'],
  browser: ['browser', 'website', 'webpage', 'url', 'internet', 'history', 'visited'],
};

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'at', 'by', 'find', 'for', 'from', 'i', 'in',
  'me', 'of', 'on', 'please', 'the', 'to', 'where', 'was', 'we', 'with',
]);

const normalizeWords = (value: string) =>
  value.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

const expandWords = (words: string[]) => {
  const expanded = new Set<string>();
  for (const word of words) {
    if (word.length < 2 || STOP_WORDS.has(word)) continue;
    expanded.add(word);
    for (const [concept, aliases] of Object.entries(CONCEPTS)) {
      if (aliases.includes(word) || concept === word) {
        expanded.add(concept);
        aliases.forEach(alias => expanded.add(alias));
      }
    }
  }
  return expanded;
};

export const getSemanticSearchTerms = (query: string) =>
  [...expandWords(normalizeWords(query))].slice(0, 100);

const makeSnippet = (content: string, queryTerms: Set<string>) => {
  const compact = content.replace(/\s+/g, ' ').trim();
  if (!compact) return '';
  const lower = compact.toLocaleLowerCase();
  const offsets = [...queryTerms]
    .map(term => lower.indexOf(term))
    .filter(offset => offset >= 0);
  const center = offsets.length ? Math.min(...offsets) : 0;
  const start = Math.max(0, center - 70);
  const end = Math.min(compact.length, start + 190);
  return `${start > 0 ? '…' : ''}${compact.slice(start, end)}${end < compact.length ? '…' : ''}`;
};

export const searchFilesByMeaning = (
  query: string,
  files: VirtualFile[],
  limit = 12,
): SemanticFileMatch[] => {
  const queryWords = normalizeWords(query).filter(word => !STOP_WORDS.has(word));
  if (!queryWords.length) return [];

  const queryTerms = expandWords(queryWords);
  const queryConcepts = new Set(
    Object.entries(CONCEPTS)
      .filter(([, aliases]) => aliases.some(alias => queryTerms.has(alias)))
      .map(([concept]) => concept),
  );

  return files
    .filter(file => !file.isDeleted && file.type !== 'folder')
    .map(file => {
      const content = file.content ?? '';
      const titleText = `${file.name} ${file.path} ${file.extension ?? ''}`;
      const contentWords = expandWords(normalizeWords(content));
      const titleWords = new Set(normalizeWords(titleText));
      const matchedTerms = [...queryTerms].filter(term => contentWords.has(term));
      const matchedConcepts = [...queryConcepts].filter(concept =>
        matchedTerms.includes(concept) ||
        (CONCEPTS[concept] ?? []).some(alias => matchedTerms.includes(alias)),
      );
      const contentCoverage = queryWords.filter(word =>
        contentWords.has(word) ||
        (CONCEPTS[matchedConcepts[0] ?? ''] ?? []).some(alias => alias === word && matchedConcepts.length > 0),
      ).length;
      const nameMatches = queryWords.filter(word => titleWords.has(word)).length;
      const score = matchedConcepts.length * 3 +
        matchedTerms.length +
        contentCoverage * 1.5 +
        nameMatches * 0.2;
      return {
        file,
        score,
        snippet: makeSnippet(content, queryTerms),
        matchedConcepts,
      };
    })
    .filter(match => match.score > 0)
    .sort((left, right) => right.score - left.score || left.file.name.localeCompare(right.file.name))
    .slice(0, limit);
};
