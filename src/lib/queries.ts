import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import { http } from '#/lib/http'
import { getGraph, getNews, getNewsAnalysis, getVerify } from '#/lib/api'
import type {
  BriefingResult,
  NewsAnalysis,
  NewsListPage,
  OntologyEdge,
  OntologyNode,
  VerifyResponse,
} from '#/types'

/**
 * docs/KOSLINK-FRONTEND.md §5 API 명세에 맞춘 fetch 계층 + TanStack Query 훅.
 * 각 훅의 placeholderData는 lib/api.ts의 동기 함수(§11 데모 안전장치)를 그대로
 * 재사용한다 — MSW 핸들러도 같은 함수를 응답 생성에 쓰므로 두 경로가 항상
 * 같은 데이터를 본다.
 */

export const queryKeys = {
  news: (sector: string) => ['news', sector] as const,
  newsAnalysis: (newsId: string) => ['news', newsId, 'analysis'] as const,
  graph: () => ['graph'] as const,
  verify: (sector: string) => ['verify', sector] as const,
}

/** GET /api/news, GET /api/verify가 공유하는 커서 페이지 쿼리스트링. */
function pageSearchParams(sector: string, cursor?: string) {
  const searchParams: Record<string, string> = {}
  if (sector && sector !== '전체') searchParams.sector = sector
  if (cursor) searchParams.cursor = cursor
  return searchParams
}

async function fetchNews(
  sector: string,
  cursor?: string,
): Promise<NewsListPage> {
  const searchParams = pageSearchParams(sector, cursor)
  return http.get('news', { searchParams }).json<NewsListPage>()
}

async function fetchNewsAnalysis(newsId: string): Promise<NewsAnalysis> {
  return http.get(`news/${newsId}/analysis`).json<NewsAnalysis>()
}

async function fetchGraph(): Promise<{
  nodes: OntologyNode[]
  edges: OntologyEdge[]
}> {
  return http.get('graph').json()
}

async function fetchVerify(
  sector: string,
  cursor?: string,
): Promise<VerifyResponse> {
  const searchParams = pageSearchParams(sector, cursor)
  return http.get('verify', { searchParams }).json<VerifyResponse>()
}

async function postBriefing(tickers: string[]): Promise<BriefingResult> {
  return http.post('briefing', { json: { tickers } }).json<BriefingResult>()
}

/** 뉴스 목록 — 무한 스크롤용 커서 기반 페이징. `data.pages.flatMap(p => p.items)`로 펼쳐 쓴다. */
export function useNewsQuery(sector: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.news(sector),
    queryFn: ({ pageParam }) => fetchNews(sector, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: () => ({
      pages: [getNews({ sector })],
      pageParams: [undefined],
    }),
  })
}

export function useNewsAnalysisQuery(newsId: string | null) {
  return useQuery({
    queryKey: queryKeys.newsAnalysis(newsId ?? ''),
    queryFn: () => fetchNewsAnalysis(newsId as string),
    enabled: !!newsId,
    placeholderData: () =>
      newsId ? (getNewsAnalysis(newsId) ?? undefined) : undefined,
  })
}

export function useGraphQuery() {
  return useQuery({
    queryKey: queryKeys.graph(),
    queryFn: fetchGraph,
    placeholderData: getGraph,
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

export function useBriefingMutation() {
  return useMutation({ mutationFn: postBriefing })
}
