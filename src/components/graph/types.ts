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
}

export type RelFlowEdge = Edge<RelEdgeData, 'rel'>
