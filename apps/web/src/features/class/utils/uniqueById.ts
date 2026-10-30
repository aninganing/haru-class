/** 같은 id가 다시 나오면 처음 것만 남긴다 (순서 유지). 페이지 사이에 같은 클래스가 섞여 와도 key가 겹치지 않게 한다. */
export function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => !seen.has(item.id) && Boolean(seen.add(item.id)));
}
