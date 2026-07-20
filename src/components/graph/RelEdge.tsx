import {
  EdgeLabelRenderer,
  Position,
  getBezierPath,
  useInternalNode,
} from '@xyflow/react'
import type { EdgeProps, InternalNode } from '@xyflow/react'
import { cn } from '#/lib/utils'
import type { RelFlowEdge, StockFlowNode } from './types'

/**
 * 기본 엣지는 Handle 위치에 고정돼 방사형 배치에서 카드 옆구리에 어긋나 붙는다.
 * 두 카드의 사각형 테두리 교점을 계산하는 플로팅 엣지로 대체한다.
 */

interface Box {
  x: number
  y: number
  w: number
  h: number
}
interface Pt {
  x: number
  y: number
}

function box(n: InternalNode<StockFlowNode>): Box {
  return {
    x: n.internals.positionAbsolute.x + (n.measured.width ?? 150) / 2,
    y: n.internals.positionAbsolute.y + (n.measured.height ?? 58) / 2,
    w: n.measured.width ?? 150,
    h: n.measured.height ?? 58,
  }
}

function rectPoint(a: Box, b: Box): Pt {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const hw = a.w / 2 + 6
  const hh = a.h / 2 + 6
  const t = Math.min(Math.abs(hw / (dx || 1e-6)), Math.abs(hh / (dy || 1e-6)))
  return { x: a.x + dx * t, y: a.y + dy * t }
}

function sideOf(from: Pt, to: Pt): Position {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (Math.abs(dx) > Math.abs(dy))
    return dx > 0 ? Position.Right : Position.Left
  return dy > 0 ? Position.Bottom : Position.Top
}

// 라벨은 활성 상태(상승/하락)와 호버 시에만 보인다 — 2단계(up2/down2)는 밀도를 위해 숨긴다.
const SHOW_LABEL_STATES = new Set(['up', 'down', 'near'])

export default function RelEdge({
  id,
  source,
  target,
  data,
  markerEnd,
}: EdgeProps<RelFlowEdge>) {
  const sourceNode = useInternalNode<StockFlowNode>(source)
  const targetNode = useInternalNode<StockFlowNode>(target)
  if (!sourceNode || !targetNode || !data) return null

  const a = box(sourceNode)
  const b = box(targetNode)
  const p1 = rectPoint(a, b)
  const p2 = rectPoint(b, a)
  const [path, labelX, labelY] = getBezierPath({
    sourceX: p1.x,
    sourceY: p1.y,
    targetX: p2.x,
    targetY: p2.y,
    sourcePosition: sideOf(p1, p2),
    targetPosition: sideOf(p2, p1),
    curvature: 0.28,
  })

  const showLabel = SHOW_LABEL_STATES.has(data.state)

  return (
    <>
      <path
        id={id}
        d={path}
        markerEnd={markerEnd}
        className={cn('ep', data.state, data.draw && 'draw')}
      />
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              'elabel',
              'show',
              (data.state === 'up' || data.state === 'down') && data.state,
            )}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {data.relation}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
