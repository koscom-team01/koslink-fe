import { useQuery } from '@tanstack/react-query'
import { http } from '#/shared/apis/http'
import { getNewsImpact, hasMockOnlyImpact } from './mock'
import { mapNewsImpact } from './mappers'
import type { NewsImpactWire } from './mappers'
import type { NewsImpact } from '#/types/analysis'

export const analysisKeys = {
  impact: (newsId: number) => ['news', newsId, 'impact'] as const,
}

async function fetchNewsImpact(newsId: number): Promise<NewsImpact> {
  // 데모용으로 프론트에서 즉석 편성한 뉴스(예: 518/519)는 실 백엔드에 대응 데이터가
  // 없으므로 IMPACT API를 호출하지 않고 로컬 목데이터를 그대로 사용한다.
  if (hasMockOnlyImpact(newsId)) {
    const wire = getNewsImpact(newsId)
    if (!wire) throw new Error(`Missing mock impact data for newsId ${newsId}`)
    return mapNewsImpact(newsId, wire)
  }
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
