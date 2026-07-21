import type { Edge, Node } from '@xyflow/react'
import type { Direction } from '#/types'

export type NodeVisualState =
  | 'hide'
  | 'idle'
  | 'dim'
  | 'via'
  | 'via2'
  | 'up'
  | 'down'
  | 'up2'
  | 'down2'
  | 'origin'

export interface StockNodeData extends Record<string, unknown> {
  label: string
  ticker?: string
  abstract: boolean
  tier?: 't1' | 't2' | 't3'
  state: NodeVisualState
  isMain?: boolean
  badge?: Direction | null
  pulseToken?: number
}

export type StockFlowNode = Node<StockNodeData, 'stock'>

export type EdgeVisualState =
  'hide' | 'idle' | 'dim' | 'near' | 'up' | 'down' | 'up2' | 'down2'

export interface RelEdgeData extends Record<string, unknown> {
  relation: string
  state: EdgeVisualState
  draw?: boolean
  /** draw가 true가 된 시각(performance.now()). 그리기 애니메이션의 진행률을
   * 경과 시간으로 계산해, 리렌더/리마운트가 일어나도 처음부터 다시 그려지지
   * 않고 진행 중이던 지점부터 이어 그리게 하는 데 쓰인다. */
  drawAt?: number
}

export type RelFlowEdge = Edge<RelEdgeData, 'rel'>
