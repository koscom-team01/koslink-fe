import type { Direction } from '#/shared/types'
import type { OntologyNode } from '#/types/graph'

export function arrow(direction: Direction): '▲' | '▼' {
  return direction === 'UP' ? '▲' : '▼'
}

export function directionLabel(direction: Direction): '상승' | '하락' {
  return direction === 'UP' ? '상승' : '하락'
}

/** relativeTime이 없는(실 API) 뉴스를 위한 폴백. 정적 목데이터는 저장된 relativeTime을 그대로 쓴다. */
export function formatRelativeTime(publishedAt: string): string {
  const diffMs = Date.now() - new Date(publishedAt).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
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
