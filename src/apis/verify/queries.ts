import { useInfiniteQuery } from '@tanstack/react-query'
import { http } from '#/shared/apis/http'
import { getVerify } from './mock'
import type { VerifyResponse } from '#/types/verify'

export const verifyKeys = {
  bySector: (sector: string) => ['verify', sector] as const,
}

/** GET /api/verify가 쓰는 sector/cursor 쿼리스트링. */
function pageSearchParams(sector: string, cursor?: string) {
  const searchParams: Record<string, string> = {}
  if (sector && sector !== '전체') searchParams.sector = sector
  if (cursor) searchParams.cursor = cursor
  return searchParams
}

async function fetchVerify(
  sector: string,
  cursor?: string,
): Promise<VerifyResponse> {
  const searchParams = pageSearchParams(sector, cursor)
  return http.get('verify', { searchParams }).json<VerifyResponse>()
}

/** 검증 목록 — 무한 스크롤용 커서 기반 페이징. `data.pages.flatMap(p => p.news)`로 펼쳐 쓴다. */
export function useVerifyQuery(sector: string) {
  return useInfiniteQuery({
    queryKey: verifyKeys.bySector(sector),
    queryFn: ({ pageParam }) => fetchVerify(sector, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: () => ({
      pages: [getVerify({ sector })],
      pageParams: [undefined],
    }),
  })
}
