import { ONTOLOGY_EDGES, ONTOLOGY_NODES } from './data'
import type { OntologyNode } from '#/types'

/**
 * React Flow에는 레이아웃 엔진이 없다. 좌표는 여기서 삼각함수로 직접 계산한다.
 * dagre·elkjs 등 레이아웃 라이브러리를 붙이지 않는다.
 */

export interface LayoutPoint {
  x: number
  y: number
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
  maxLevel: number
  pos: Record<string, LayoutPoint>
}

function edgeKey(a: string, b: string) {
  return [a, b].sort().join('|')
}

/** 노드/인접 리스트/관계 조회용 인덱스. 정적 온톨로지 기준으로 한 번만 계산한다. */
export const graphIndex = (() => {
  const byId = new Map(ONTOLOGY_NODES.map((n) => [n.id, n]))
  const adjacency = new Map<string, string[]>()
  ONTOLOGY_NODES.forEach((n) => adjacency.set(n.id, []))
  const relationByKey = new Map<
    string,
    { relation: string; polarity: 1 | -1 }
  >()
  ONTOLOGY_EDGES.forEach((e) => {
    adjacency.get(e.source)?.push(e.target)
    adjacency.get(e.target)?.push(e.source)
    relationByKey.set(edgeKey(e.source, e.target), {
      relation: e.relation,
      polarity: e.polarity,
    })
  })
  return { byId, adjacency, relationByKey }
})()

function lookupRelation(
  a: string,
  b: string,
): { relation: string; polarity: 1 | -1 } {
  return (
    graphIndex.relationByKey.get(edgeKey(a, b)) ?? {
      relation: '연관',
      polarity: 1,
    }
  )
}

const RADIUS = [0, 300, 520, 700]

/** 파급 경로: 기점 중앙, hop 레벨별 동심원(타원) 배치 */
export function radialLayout(
  ids: string[],
  level: Record<string, number>,
): Record<string, LayoutPoint> {
  const byLevel: Record<number, string[]> = {}
  ids.forEach((id) => {
    const lv = level[id] ?? 0
    ;(byLevel[lv] ??= []).push(id)
  })

  const pos: Record<string, LayoutPoint> = {}
  Object.entries(byLevel).forEach(([levelKey, arr]) => {
    const l = Number(levelKey)
    if (l === 0) {
      pos[arr[0]] = { x: 0, y: 0 }
      return
    }
    const step = (2 * Math.PI) / arr.length
    const offset = -Math.PI / 2 + (l % 2 ? 0 : step / 2)
    arr.forEach((id, i) => {
      const angle = offset + step * i
      const r = RADIUS[Math.min(l, 3)]
      pos[id] = { x: Math.cos(angle) * r, y: Math.sin(angle) * r * 0.76 }
    })
  })
  return pos
}

/** 뉴스 분석의 related[].chain을 펼쳐 노드·엣지·hop 레벨을 산출한다. */
export function focusBuild(
  mainNodeId: string,
  related: { nodeId: string; chain: string[] }[],
): BuiltGraph {
  const level = new Map<string, number>([[mainNodeId, 0]])
  const set = new Set<string>([mainNodeId])
  const pairs: GraphPair[] = []
  const seen = new Set<string>()

  related.forEach((r) => {
    r.chain.forEach((id, k) => {
      set.add(id)
      const existing = level.get(id)
      if (existing === undefined || k < existing) level.set(id, k)
      if (k > 0) {
        const a = r.chain[k - 1]
        const key = `${a}>${id}`
        if (!seen.has(key)) {
          seen.add(key)
          const rel = lookupRelation(a, id)
          pairs.push({
            source: a,
            target: id,
            relation: rel.relation,
            polarity: rel.polarity,
            level: k,
          })
        }
      }
    })
  })

  const ids = Array.from(set)
  const levelObj = Object.fromEntries(level)
  const maxLevel = ids.reduce((m, id) => Math.max(m, levelObj[id] ?? 0), 0)
  return {
    ids,
    pairs,
    level: levelObj,
    maxLevel,
    pos: radialLayout(ids, levelObj),
  }
}

/** 특정 노드 기점 BFS(기본 2단계) */
export function nodeBuild(originId: string, maxHop = 2): BuiltGraph {
  const level = new Map<string, number>([[originId, 0]])
  const pairs: GraphPair[] = []
  const seen = new Set<string>()
  const queue = [originId]

  while (queue.length) {
    const current = queue.shift()!
    const currentLevel = level.get(current) ?? 0
    if (currentLevel >= maxHop) continue
    for (const neighbor of graphIndex.adjacency.get(current) ?? []) {
      const key = edgeKey(current, neighbor)
      if (!level.has(neighbor)) {
        level.set(neighbor, currentLevel + 1)
        queue.push(neighbor)
      }
      if (level.get(neighbor) === currentLevel + 1 && !seen.has(key)) {
        seen.add(key)
        const rel = lookupRelation(current, neighbor)
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
    maxLevel,
    pos: radialLayout(ids, levelObj),
  }
}

const SECTOR_CENTERS: Record<string, LayoutPoint> = {
  반도체: { x: -820, y: -60 },
  '2차전지': { x: 760, y: -100 },
  방산: { x: -40, y: 660 },
}

export interface FullLayout {
  pos: Record<string, LayoutPoint>
  sectorLabelPos: Record<string, LayoutPoint>
}

/**
 * 섹터 3클러스터 고정 좌표. 클러스터 안은 연결 수 내림차순 동심원.
 * 호출부(GraphPanel)에서 useMemo로 캐시해 뷰 전환 시 재계산되지 않게 한다.
 */
export function fullLayout(): FullLayout {
  const pos: Record<string, LayoutPoint> = {}
  const sectorLabelPos: Record<string, LayoutPoint> = {}

  function ring(
    nodes: OntologyNode[],
    center: LayoutPoint,
    radius: number,
    offset: number,
  ) {
    nodes.forEach((n, i) => {
      const angle = offset + (i * 2 * Math.PI) / Math.max(nodes.length, 1)
      pos[n.id] = {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius * 0.8,
      }
    })
  }

  Object.entries(SECTOR_CENTERS).forEach(([sector, center]) => {
    const list = ONTOLOGY_NODES.filter((n) => n.sector === sector).sort(
      (a, b) =>
        (graphIndex.adjacency.get(b.id)?.length ?? 0) -
        (graphIndex.adjacency.get(a.id)?.length ?? 0),
    )
    if (list.length === 0) return

    pos[list[0].id] = { x: center.x, y: center.y }
    const rest = list.slice(1)
    ring(rest.slice(0, 6), center, 275, -Math.PI / 2)
    ring(
      rest.slice(6),
      center,
      480,
      -Math.PI / 2 + Math.PI / Math.max(rest.length - 6, 1),
    )
    sectorLabelPos[sector] = { x: center.x, y: center.y - 330 }
  })

  return { pos, sectorLabelPos }
}

/** 전체 관계망 위계(연결 수 기준 3단계) — 진한 잉크(t1)일수록 핵심 노드 */
export function tierOf(id: string): 't1' | 't2' | 't3' {
  const degree = graphIndex.adjacency.get(id)?.length ?? 0
  if (degree >= 7) return 't1'
  if (degree >= 4) return 't2'
  return 't3'
}
