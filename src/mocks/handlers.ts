import { HttpResponse, delay, http } from 'msw'
import {
  getGraph,
  getNews,
  getNewsAnalysis,
  getVerify,
  runBriefing,
} from '#/lib/api'

/**
 * docs/KOSLINK-FRONTEND.md §5 API 명세와 동일한 JSON 모양으로 응답한다.
 * 응답 바디는 lib/api.ts의 기존 동기 함수를 그대로 호출해 만든다 — 이 "서버"와
 * TanStack Query의 placeholderData가 항상 같은 데이터 소스(lib/data.ts)를 본다.
 */

/** /api/news, /api/verify가 함께 쓰는 sector/cursor/limit 쿼리스트링 파싱. */
function readPageParams(url: string) {
  const searchParams = new URL(url).searchParams
  return {
    sector: searchParams.get('sector') ?? undefined,
    cursor: searchParams.get('cursor') ?? undefined,
    limit: Number(searchParams.get('limit')) || undefined,
  }
}

export const handlers = [
  http.get('/api/news', async ({ request }) => {
    await delay(300)
    return HttpResponse.json(getNews(readPageParams(request.url)))
  }),

  http.get('/api/news/:id/analysis', async ({ params }) => {
    await delay(350)
    const analysis = getNewsAnalysis(params.id as string)
    if (!analysis) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(analysis)
  }),

  http.get('/api/graph', async () => {
    await delay(250)
    return HttpResponse.json(getGraph())
  }),

  http.post('/api/briefing', async ({ request }) => {
    await delay(400)
    const { tickers } = (await request.json()) as { tickers: string[] }
    return HttpResponse.json(runBriefing(tickers))
  }),

  http.get('/api/verify', async ({ request }) => {
    await delay(300)
    return HttpResponse.json(getVerify(readPageParams(request.url)))
  }),
]
