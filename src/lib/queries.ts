import { useMutation, useQuery } from '@tanstack/react-query'
import { http } from '#/lib/http'
import { getGraph, getNews, getNewsAnalysis, getVerify } from '#/lib/api'
import type {
  BriefingResult,
  NewsAnalysis,
  NewsListItem,
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
  verify: () => ['verify'] as const,
}

async function fetchNews(sector?: string): Promise<NewsListItem[]> {
  const searchParams = sector && sector !== '전체' ? { sector } : undefined
  const { items } = await http
    .get('news', { searchParams })
    .json<{ items: NewsListItem[] }>()
  return items
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

async function fetchVerify(): Promise<VerifyResponse> {
  return http.get('verify').json<VerifyResponse>()
}

async function postBriefing(tickers: string[]): Promise<BriefingResult> {
  return http.post('briefing', { json: { tickers } }).json<BriefingResult>()
}

export function useNewsQuery(sector: string) {
  return useQuery({
    queryKey: queryKeys.news(sector),
    queryFn: () => fetchNews(sector),
    placeholderData: () => getNews(sector),
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

export function useVerifyQuery() {
  return useQuery({
    queryKey: queryKeys.verify(),
    queryFn: fetchVerify,
    placeholderData: getVerify,
  })
}

export function useBriefingMutation() {
  return useMutation({ mutationFn: postBriefing })
}
