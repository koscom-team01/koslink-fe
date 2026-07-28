import { ONTOLOGY_EDGES, ONTOLOGY_NODES } from '#/mocks/graph/data'
import type { OntologyEdge, OntologyNode } from '#/types/graph'

export interface GetGraphParams {
  mode: 'full'
}

export function getGraph(
  _params?: GetGraphParams,
): { nodes: OntologyNode[]; edges: OntologyEdge[] } {
  return { nodes: ONTOLOGY_NODES, edges: ONTOLOGY_EDGES }
}
