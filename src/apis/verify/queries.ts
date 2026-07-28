import { useInfiniteQuery } from '@tanstack/react-query'
import { getVerify } from './mock'

export const verifyKeys = {
  bySector: (sector: string) => ['verify', sector] as const,
}

/** 예측 검증 탭 — 실 백엔드에 해당 API가 없어 verify.json 더미 데이터를
 * API를 거치지 않고 클라이언트에서 직접 페이징한다. */
function fetchVerify(sector: string, cursor?: string) {
  return getVerify({ sector, cursor })
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
