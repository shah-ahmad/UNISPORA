export async function collectUniversityPages<T extends { $id: string }>(loadPage: (cursor?: string) => Promise<T[]>, pageSize = 100): Promise<T[]> {
  const records = new Map<string, T>();
  let cursor: string | undefined;
  for (;;) {
    const page = await loadPage(cursor);
    for (const record of page) records.set(record.$id, record);
    if (page.length < pageSize) return [...records.values()];
    const next = page.at(-1)!.$id;
    if (next === cursor) throw new Error('University pagination did not advance.');
    cursor = next;
  }
}
export function validUniversityCoordinates(latitude: unknown, longitude: unknown): boolean {
  return typeof latitude === 'number' && Number.isFinite(latitude) && Math.abs(latitude) <= 90
    && typeof longitude === 'number' && Number.isFinite(longitude) && Math.abs(longitude) <= 180;
}
