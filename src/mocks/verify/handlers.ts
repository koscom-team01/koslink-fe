import { HttpResponse, delay, http } from 'msw'
import { getVerify } from '#/apis/verify/mock'

export const verifyHandlers = [
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
