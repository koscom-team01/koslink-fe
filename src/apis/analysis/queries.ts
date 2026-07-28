import { useQuery } from '@tanstack/react-query'
import { http } from '#/shared/apis/http'
import { getNewsImpact } from './mock'
import { mapNewsImpact } from './mappers'
import type { NewsImpactWire } from './mappers'
import type { NewsImpact } from '#/types/analysis'

export const analysisKeys = {
  impact: (newsId: number) => ['news', newsId, 'impact'] as const,
}

async function fetchNewsImpact(newsId: number): Promise<NewsImpact> {
  const wire = await http.get(`news/${newsId}/impact`).json<NewsImpactWire>()
  return mapNewsImpact(newsId, wire)
}

/** 뉴스 영향 분석 + 파급 경로 그래프 — 분석 패널과 그래프 패널이 같은 쿼리 키를 공유해 한 번만 조회한다. */
export function useNewsImpactQuery(newsId: number | null) {
  return useQuery({
    queryKey: analysisKeys.impact(newsId ?? -1),
    queryFn: () => fetchNewsImpact(newsId as number),
    enabled: newsId != null,
    placeholderData: () => {
      if (newsId == null) return undefined
      const wire = getNewsImpact(newsId)
      return wire ? mapNewsImpact(newsId, wire) : undefined
    },
  })
}
