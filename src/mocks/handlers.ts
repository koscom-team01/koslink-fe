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
export const handlers = [
  http.get('/api/news', async ({ request }) => {
    await delay(300)
    const sector = new URL(request.url).searchParams.get('sector') ?? undefined
    return HttpResponse.json({ items: getNews(sector) })
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

  http.get('/api/verify', async () => {
    await delay(300)
    return HttpResponse.json(getVerify())
  }),
]
