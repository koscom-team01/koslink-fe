import { HttpResponse, delay, http } from 'msw'
import { getNews } from '#/apis/news/mock'

/**
 * docs/KOSLINK-FRONTEND.md §5 API 명세와 동일한 JSON 모양으로 응답한다.
 * 응답 바디는 apis/news/mock.ts의 기존 동기 함수를 그대로 호출해 만든다 — 이 "서버"와
 * TanStack Query의 placeholderData가 항상 같은 데이터 소스(mocks/news/data.ts)를 본다.
 */

export const newsHandlers = [
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
]
