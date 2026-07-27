import { HttpResponse, delay, http } from 'msw'
import { getGraph, getNews, getNewsImpact, getVerify } from '#/lib/api'

/**
 * docs/KOSLINK-FRONTEND.md §5 API 명세와 동일한 JSON 모양으로 응답한다.
 * 응답 바디는 lib/api.ts의 기존 동기 함수를 그대로 호출해 만든다 — 이 "서버"와
 * TanStack Query의 placeholderData가 항상 같은 데이터 소스(lib/data.ts)를 본다.
 */

export const handlers = [
  http.get('/api/news', async ({ request }) => {
    await delay(300)
    const searchParams = new URL(request.url).searchParams
    return HttpResponse.json(
      getNews({
        cursor: searchParams.get('cursor') ?? undefined,
        limit: Number(searchParams.get('limit')) || undefined,
      }),
    )
  }),

  http.get('/api/news/:id/impact', async ({ params }) => {
    await delay(350)
    const impact = getNewsImpact(Number(params.id))
    if (!impact) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(impact)
  }),

  http.get('/api/graph', async () => {
    await delay(250)
    return HttpResponse.json(getGraph({ mode: 'full' }))
  }),

  http.get('/api/verify', async ({ request }) => {
    await delay(300)
    const searchParams = new URL(request.url).searchParams
    return HttpResponse.json(
      getVerify({
        sector: searchParams.get('sector') ?? undefined,
        cursor: searchParams.get('cursor') ?? undefined,
        limit: Number(searchParams.get('limit')) || undefined,
      }),
    )
  }),
]
