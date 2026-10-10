import test from 'node:test';
import assert from 'node:assert/strict';
import { collectUniversityPages, validUniversityCoordinates } from '../src/data/universityPaging.ts';

test('loads records beyond the former 300-university limit', async () => {
  const records = Array.from({length: 351}, (_, i) => ({$id:String(i)}));
  const result = await collectUniversityPages(async cursor => records.slice(cursor ? Number(cursor)+1 : 0, (cursor ? Number(cursor)+1 : 0)+100));
  assert.equal(result.length,351); assert.equal(result.at(-1).$id,'350');
});
test('empty data and exact page boundaries finish correctly', async () => {
  assert.deepEqual(await collectUniversityPages(async () => []),[]);
  let calls = 0;
  const result = await collectUniversityPages(async cursor => { calls++; return cursor ? [] : [{$id:'a'},{$id:'b'}]; },2);
  assert.equal(result.length,2); assert.equal(calls,2);
});
test('failed later page never returns a silently incomplete directory', async () => {
  await assert.rejects(collectUniversityPages(async cursor => { if (cursor) throw new Error('Unavailable'); return [{$id:'a'}]; },1), /Unavailable/);
});
test('rejects stalled cursors instead of looping forever', async () => {
  await assert.rejects(collectUniversityPages(async () => [{$id:'a'}],1), /did not advance/);
});
test('coordinates include zero and boundaries, but reject malformed values', () => {
  for (const pair of [[0,0],[90,180],[-90,-180],[47.5531,21.621]]) assert.equal(validUniversityCoordinates(...pair),true);
  for (const pair of [[91,0],[0,181],[NaN,0],[0,Infinity],[null,0],['47',21]]) assert.equal(validUniversityCoordinates(...pair),false);
});
