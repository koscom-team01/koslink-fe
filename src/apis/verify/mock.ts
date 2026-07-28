import { VERIFY_ENTRIES, buildVerifyDaily } from '#/mocks/verify/data'
import { paginate } from '#/shared/apis/paginate'
import type { VerifyResponse } from '#/types/verify'

function bySector<T extends { sector: string }>(
  items: T[],
  sector?: string,
): T[] {
  return items.filter(
    (n) => !sector || sector === '전체' || n.sector === sector,
  )
}

export interface GetVerifyParams {
  sector?: string
  /** 이전 응답의 nextCursor. 첫 페이지는 생략한다. */
  cursor?: string
  limit?: number
}

const DEFAULT_VERIFY_LIMIT = 10

export function getVerify({
  sector,
  cursor,
  limit = DEFAULT_VERIFY_LIMIT,
}: GetVerifyParams = {}): VerifyResponse {
  const { page, nextCursor } = paginate(
    bySector(VERIFY_ENTRIES, sector),
    cursor,
    limit,
    (v) => v.newsId,
  )
  // daily 추이는 섹터/페이지와 무관한 전체 집계라 페이징하지 않는다.
  return { daily: buildVerifyDaily(), news: page, nextCursor }
}
