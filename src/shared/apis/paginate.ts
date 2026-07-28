/**
 * 목록 커서 페이징 공통 로직. cursor는 "마지막으로 받은 항목의 커서 키" 관례를
 * 쓰지만, 클라이언트는 이 값을 해석하지 않고 nextCursor를 그대로 되돌려주기만
 * 한다. apis/news/mock.ts, apis/verify/mock.ts가 함께 쓴다.
 */
export function paginate<T>(
  items: T[],
  cursor: string | undefined,
  limit: number,
  cursorOf: (item: T) => string,
): { page: T[]; nextCursor: string | null } {
  const startIndex = cursor
    ? Math.max(items.findIndex((item) => cursorOf(item) === cursor) + 1, 0)
    : 0
  const page = items.slice(startIndex, startIndex + limit)
  const last = page.at(-1)
  const nextCursor =
    startIndex + limit < items.length && last ? cursorOf(last) : null
  return { page, nextCursor }
}
