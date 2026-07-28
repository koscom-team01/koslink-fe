import { newsHandlers } from '#/mocks/news/handlers'
import { analysisHandlers } from '#/mocks/analysis/handlers'
import { graphHandlers } from '#/mocks/graph/handlers'

export const handlers = [...newsHandlers, ...analysisHandlers, ...graphHandlers]
