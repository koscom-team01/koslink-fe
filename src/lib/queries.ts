import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { http } from '#/lib/http'
import { getGraph, getNews, getNewsImpact, getVerify } from '#/lib/api'
import { mapNewsImpact, mapNewsListPage } from '#/lib/mappers'
import type { NewsImpactWire, NewsListPageWire } from '#/lib/mappers'
import type {
  NewsImpact,
  NewsListPage,
  OntologyEdge,
  OntologyNode,
  VerifyResponse,
} from '#/types'

/**
 * docs/KOSLINK-FRONTEND.md §5 API 명세에 맞춘 fetch 계층 + TanStack Query 훅.
 * 각 훅의 placeholderData는 lib/api.ts의 동기 함수(§11 데모 안전장치)를 lib/mappers.ts로
 * 한 번 더 거쳐 반환한다 — MSW 핸들러도 같은 함수를 응답 생성에 쓰므로 두 경로가 항상
 * 같은 데이터를 본다.
 */

export const queryKeys = {
  news: () => ['news'] as const,
  newsImpact: (newsId: number) => ['news', newsId, 'impact'] as const,
  graph: () => ['graph'] as const,
  verify: (sector: string) => ['verify', sector] as const,
}

/** GET /api/verify가 쓰는 sector/cursor 쿼리스트링. */
function pageSearchParams(sector: string, cursor?: string) {
  const searchParams: Record<string, string> = {}
  if (sector && sector !== '전체') searchParams.sector = sector
  if (cursor) searchParams.cursor = cursor
  return searchParams
}

async function fetchNews(cursor?: string): Promise<NewsListPage> {
  const searchParams: Record<string, string> = {}
  if (cursor) searchParams.cursor = cursor
  const wire = await http
    .get('news', { searchParams })
    .json<NewsListPageWire>()
  return mapNewsListPage(wire)
}

async function fetchNewsImpact(newsId: number): Promise<NewsImpact> {
  const wire = await http.get(`news/${newsId}/impact`).json<NewsImpactWire>()
  return mapNewsImpact(newsId, wire)
}

async function fetchGraph(): Promise<{
  nodes: OntologyNode[]
  edges: OntologyEdge[]
}> {
  return http.get('graph', { searchParams: { mode: 'full' } }).json()
}

async function fetchVerify(
  sector: string,
  cursor?: string,
): Promise<VerifyResponse> {
  const searchParams = pageSearchParams(sector, cursor)
  return http.get('verify', { searchParams }).json<VerifyResponse>()
}

/** 뉴스 목록 — 무한 스크롤용 커서 기반 페이징. `data.pages.flatMap(p => p.items)`로 펼쳐 쓴다. */
export function useNewsQuery() {
  return useInfiniteQuery({
    queryKey: queryKeys.news(),
    queryFn: ({ pageParam }) => fetchNews(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: () => ({
      pages: [mapNewsListPage(getNews())],
      pageParams: [undefined],
    }),
  })
}

/** 뉴스 영향 분석 + 파급 경로 그래프 — 분석 패널과 그래프 패널이 같은 쿼리 키를 공유해 한 번만 조회한다. */
export function useNewsImpactQuery(newsId: number | null) {
  return useQuery({
    queryKey: queryKeys.newsImpact(newsId ?? -1),
    queryFn: () => fetchNewsImpact(newsId as number),
    enabled: newsId != null,
    placeholderData: () => {
      if (newsId == null) return undefined
      const wire = getNewsImpact(newsId)
      return wire ? mapNewsImpact(newsId, wire) : undefined
    },
  })
}

export function useGraphQuery() {
  return useQuery({
    queryKey: queryKeys.graph(),
    queryFn: fetchGraph,
    placeholderData: () => getGraph({ mode: 'full' }),
    staleTime: Infinity,
  })
}

/** 검증 목록 — 무한 스크롤용 커서 기반 페이징. `data.pages.flatMap(p => p.news)`로 펼쳐 쓴다. */
export function useVerifyQuery(sector: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.verify(sector),
    queryFn: ({ pageParam }) => fetchVerify(sector, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: () => ({
      pages: [getVerify({ sector })],
      pageParams: [undefined],
    }),
  })
}
