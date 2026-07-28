import { useQuery } from '@tanstack/react-query'
import { http } from '#/shared/apis/http'
import { getGraph } from './mock'
import type { OntologyEdge, OntologyNode } from '#/types/graph'

export const graphKeys = {
  all: () => ['graph'] as const,
}

async function fetchGraph(): Promise<{
  nodes: OntologyNode[]
  edges: OntologyEdge[]
}> {
  return http.get('graph', { searchParams: { mode: 'full' } }).json()
}

export function useGraphQuery() {
  return useQuery({
    queryKey: graphKeys.all(),
    queryFn: fetchGraph,
    placeholderData: () => getGraph({ mode: 'full' }),
    staleTime: Infinity,
  })
}
