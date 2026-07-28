import { ONTOLOGY_EDGES, ONTOLOGY_NODES } from './data'
import { buildGraphIndex } from './graphIndex'
import type { OntologyNode } from '#/types'

/**
 * React Flow에는 레이아웃 엔진이 없다. 좌표는 여기서 삼각함수로 직접 계산한다.
 * dagre·elkjs 등 레이아웃 라이브러리를 붙이지 않는다.
 */

export interface LayoutPoint {
  x: number
  y: number
}

/** 전체 온톨로지 인덱스. 정적 데이터 기준으로 한 번만 계산해 캐시한다. */
export const graphIndex = buildGraphIndex(ONTOLOGY_NODES, ONTOLOGY_EDGES)

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

const SECTOR_CENTERS: Record<string, LayoutPoint> = {
  반도체: { x: 0, y: 0 },
}

export interface FullLayout {
  pos: Record<string, LayoutPoint>
  sectorLabelPos: Record<string, LayoutPoint>
  /** 연결 수 기준 최고 허브 노드 — 진입 인트로 하이라이트 기점으로 재사용된다 */
  centerId: string
}

/**
 * 섹터별 고정 좌표(현재는 반도체 단일 클러스터, 중앙 배치). 클러스터 안은 연결 수
 * 내림차순 3단 동심원(51개 규모에서 바깥 링 하나에 다 몰아넣으면 카드가 겹친다).
 * 호출부(GraphPanel)에서 useMemo로 캐시해 뷰 전환 시 재계산되지 않게 한다.
 */
export function fullLayout(): FullLayout {
  const pos: Record<string, LayoutPoint> = {}
  const sectorLabelPos: Record<string, LayoutPoint> = {}
  let centerId = ''

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
    centerId = list[0].id
    const rest = list.slice(1)
    ring(rest.slice(0, 8), center, 260, -Math.PI / 2)
    ring(rest.slice(8, 24), center, 460, -Math.PI / 2 + Math.PI / 8)
    ring(rest.slice(24), center, 700, -Math.PI / 2 + Math.PI / 16)
    sectorLabelPos[sector] = { x: center.x, y: center.y - 330 }
  })

  return { pos, sectorLabelPos, centerId }
}

/** 전체 관계망 위계(연결 수 기준 3단계) — 진한 잉크(t1)일수록 핵심 노드 */
export function tierOf(id: string): 't1' | 't2' | 't3' {
  const degree = graphIndex.adjacency.get(id)?.length ?? 0
  if (degree >= 7) return 't1'
  if (degree >= 4) return 't2'
  return 't3'
}
