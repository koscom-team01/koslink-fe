import { newsHandlers } from '#/mocks/news/handlers'
import { analysisHandlers } from '#/mocks/analysis/handlers'
import { graphHandlers } from '#/mocks/graph/handlers'
import { verifyHandlers } from '#/mocks/verify/handlers'

export const handlers = [
  ...newsHandlers,
  ...analysisHandlers,
  ...graphHandlers,
  ...verifyHandlers,
]
