import type { Direction, OntologyNode } from '#/types'

export function arrow(direction: Direction): '▲' | '▼' {
  return direction === 'UP' ? '▲' : '▼'
}

export function directionLabel(direction: Direction): '상승' | '하락' {
  return direction === 'UP' ? '상승' : '하락'
}

export type ImpactTier = 't1' | 't2' | 't3' | ''

export interface Impact {
  label: string
  tier: ImpactTier
}

/**
 * 영향의 크기는 confidence 퍼센트가 아니라 hop 수(chain.length - 1)로만 표현한다.
 * hop<=0: 뉴스 직접 대상, 1: 직접 영향, 2: 간접 영향, 3+: 확산 영향
 */
export function impactOf(hop: number): Impact {
  if (hop <= 0) return { label: '뉴스 직접 대상', tier: 't1' }
  if (hop === 1) return { label: '직접 영향', tier: 't1' }
  if (hop === 2) return { label: '간접 영향', tier: 't2' }
  return { label: '확산 영향', tier: '' }
}

export interface NodeSize {
  w: number
  h: number
}

/** 카드 크기 = 시가총액. 개념 노드는 라벨 길이에 맞춰 auto. */
export function sizeOf(node: OntologyNode): NodeSize {
  if (!node.marketCap) {
    return { w: Math.max(104, node.name.length * 15 + 32), h: 44 }
  }
  if (node.marketCap >= 300000) return { w: 172, h: 60 } // 30조↑
  if (node.marketCap >= 50000) return { w: 150, h: 58 } // 5~30조
  return { w: 134, h: 56 } // 5조↓
}
