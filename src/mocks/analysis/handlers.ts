import { HttpResponse, delay, http } from 'msw'
import { getNewsImpact } from '#/apis/analysis/mock'

export const analysisHandlers = [
  http.get('/api/news/:id/impact', async ({ params }) => {
    await delay(350)
    const impact = getNewsImpact(Number(params.id))
    if (!impact) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(impact)
  }),
]
