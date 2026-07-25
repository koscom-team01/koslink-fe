import type { OntologyEdge, OntologyNode } from '#/types'

/**
 * 노드/엣지 배열로부터 인접 리스트·관계 조회 인덱스를 만들고, 기점에서 BFS로
 * hop 레벨을 계산하는 재사용 유틸리티. 정적 전체 온톨로지(lib/layout.ts의
 * graphIndex)와 뉴스별 파급 경로 그래프(GET /api/news/{id}/graph) 양쪽에서 쓴다.
 */

export interface GraphIndex {
  byId: Map<string, OntologyNode>
  adjacency: Map<string, string[]>
  relationByKey: Map<string, { relation: string; polarity: 1 | -1 }>
}

/** 실제 RELATED_TO의 relation_type만 반대 극성(경쟁·대체)이고, 그 외(SUPPLY_TO 포함)는 항상 동조다. */
export function polarityOf(edge: Pick<OntologyEdge, 'relationType'>): 1 | -1 {
  return edge.relationType === 'COMPETITOR' ? -1 : 1
}

export function edgeKey(a: string, b: string): string {
  return [a, b].sort().join('|')
}

export function buildGraphIndex(
  nodes: OntologyNode[],
  edges: OntologyEdge[],
): GraphIndex {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const adjacency = new Map<string, string[]>()
  nodes.forEach((n) => adjacency.set(n.id, []))
  const relationByKey = new Map<
    string,
    { relation: string; polarity: 1 | -1 }
  >()
  edges.forEach((e) => {
    adjacency.get(e.source)?.push(e.target)
    adjacency.get(e.target)?.push(e.source)
    relationByKey.set(edgeKey(e.source, e.target), {
      relation: e.relation,
      polarity: polarityOf(e),
    })
  })
  return { byId, adjacency, relationByKey }
}

function lookupRelation(
  index: GraphIndex,
  a: string,
  b: string,
): { relation: string; polarity: 1 | -1 } {
  return (
    index.relationByKey.get(edgeKey(a, b)) ?? { relation: '연관', polarity: 1 }
  )
}

export interface GraphPair {
  source: string
  target: string
  relation: string
  polarity: 1 | -1
  level: number
}

export interface BuiltGraph {
  ids: string[]
  pairs: GraphPair[]
  level: Record<string, number>
  /** BFS 트리에서의 부모 노드. pathTo()로 기점까지의 경로를 복원할 때 쓴다. */
  parent: Partial<Record<string, string>>
  maxLevel: number
}

/** 기점에서 BFS로 각 노드까지의 hop 레벨과 경유 엣지를 산출한다. maxHop 생략 시 도달 가능한 전체를 펼친다. */
export function bfsBuild(
  index: GraphIndex,
  originId: string,
  maxHop = Infinity,
): BuiltGraph {
  const level = new Map<string, number>([[originId, 0]])
  const parent = new Map<string, string>()
  const pairs: GraphPair[] = []
  const seen = new Set<string>()
  const queue = [originId]

  while (queue.length) {
    const current = queue.shift()!
    const currentLevel = level.get(current) ?? 0
    if (currentLevel >= maxHop) continue
    for (const neighbor of index.adjacency.get(current) ?? []) {
      const key = edgeKey(current, neighbor)
      if (!level.has(neighbor)) {
        level.set(neighbor, currentLevel + 1)
        parent.set(neighbor, current)
        queue.push(neighbor)
      }
      if (level.get(neighbor) === currentLevel + 1 && !seen.has(key)) {
        seen.add(key)
        const rel = lookupRelation(index, current, neighbor)
        pairs.push({
          source: current,
          target: neighbor,
          relation: rel.relation,
          polarity: rel.polarity,
          level: currentLevel + 1,
        })
      }
    }
  }

  const levelObj = Object.fromEntries(level)
  const ids = Object.keys(levelObj)
  const maxLevel = ids.reduce((m, id) => Math.max(m, levelObj[id]), 0)
  return {
    ids,
    pairs,
    level: levelObj,
    parent: Object.fromEntries(parent),
    maxLevel,
  }
}

/** BFS 결과에서 기점→id까지의 노드 ID 경로를 복원한다(관련 종목 정렬·경로 표시용). */
export function pathTo(built: BuiltGraph, id: string): string[] {
  const path = [id]
  let cur = id
  for (let next = built.parent[cur]; next; next = built.parent[cur]) {
    cur = next
    path.unshift(cur)
  }
  return path
}
