import { HttpResponse, delay, http } from 'msw'
import { getGraph } from '#/apis/graph/mock'

export const graphHandlers = [
  http.get('/api/v1/graph', async () => {
    await delay(250)
    return HttpResponse.json(getGraph({ mode: 'full' }))
  }),
]
