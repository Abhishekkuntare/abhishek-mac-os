import assert from 'node:assert/strict';
import test from 'node:test';
import { searchFilesByMeaning } from '../src/services/semanticSearch.ts';

const file = (id, name, content, type = 'document') => ({
  id,
  name,
  path: '/Users/abhishek/Notes',
  size: content.length,
  type,
  content,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
});

test('finds a presentation by subject meaning rather than its filename', () => {
  const result = searchFilesByMeaning(
    'Find the presentation where I discussed the KrishiMitra disease detection model',
    [
      file('presentation', 'final_final_2.pptx', 'KrishiMitra uses computer vision and a machine learning classifier to identify crop infections.'),
      file('unrelated', 'budget.txt', 'Annual spending plans and quarterly revenue estimates.'),
    ],
  );

  assert.equal(result[0]?.file.id, 'presentation');
  assert.ok(result[0].score > 0);
  assert.ok(result[0].snippet.includes('classifier'));
});

test('ignores deleted files and folders and returns no matches for blank queries', () => {
  const deleted = { ...file('deleted', 'notes.txt', 'plant disease detection'), isDeleted: true };
  const folder = file('folder', 'Research', '', 'folder');
  assert.deepEqual(searchFilesByMeaning('crop illness diagnosis', [deleted, folder]), []);
  assert.deepEqual(searchFilesByMeaning('  ', [file('live', 'notes.txt', 'plant disease detection')]), []);
});

test('does not prioritize a filename over matching file contents', () => {
  const result = searchFilesByMeaning(
    'crop disease detection',
    [
      file('name-only', 'crop-disease-detection.txt', 'Shopping list: apples, rice, tea.'),
      file('content', 'final_final_2.pptx', 'A classifier identifies crop pathology and infection from leaf images.'),
    ],
  );
  assert.equal(result[0]?.file.id, 'content');
});
