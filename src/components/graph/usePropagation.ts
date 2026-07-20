import { useEffect, useRef, useState } from 'react'
import type { Direction } from '#/types'
import type { EdgeVisualState, NodeVisualState } from './types'

/**
 * 뉴스 파급/노드 기점 탐색/전체 관계망 제자리 강조가 공유하는 하이라이트
 * 시퀀스 훅. 셋 다 "기점 노드 점등 → hop별로 엣지가 그려지고 도착 노드가
 * 확정되는" 같은 모양이라 여기 하나로 합쳤다. 최종 색상 규칙(상승/하락/경유 등)은
 * 씬을 만드는 GraphPanel이 결정하고, 이 훅은 그 결과를 시간차로 드러내기만 한다.
 *
 * React Flow의 `animated: true`는 쓰지 않는다 — 엣지는 draw:true로 표시해
 * CSS 1회 재생(.ep.draw, animation-fill-mode: forwards)으로 그려지게 한다.
 */

export interface RevealNode {
  id: string
  level: number
  state: NodeVisualState
  badge?: Direction | null
}

export interface RevealEdge {
  id: string
  target: string
  level: number
  state: EdgeVisualState
}

export interface Scene {
  key: string
  originId: string
  originState: NodeVisualState
  nodes: RevealNode[]
  edges: RevealEdge[]
}

interface NodeRuntime {
  state: NodeVisualState
  badge?: Direction | null
  pulseToken: number
}

interface EdgeRuntime {
  state: EdgeVisualState
  draw: boolean
}

export interface PropagationResult {
  nodeOverrides: Map<string, NodeRuntime>
  edgeOverrides: Map<string, EdgeRuntime>
  active: boolean
  settled: boolean
}

const ORIGIN_DELAY = 180
const HOP_GAP = 560
const HOP_BASE = 480
const EDGE_STAGGER = 70
const NODE_REVEAL_DELAY = 260
const SETTLE_BUFFER = 500

export function usePropagation(scene: Scene | null): PropagationResult {
  const [, forceTick] = useState(0)
  const nodeOverridesRef = useRef(new Map<string, NodeRuntime>())
  const edgeOverridesRef = useRef(new Map<string, EdgeRuntime>())
  const activeRef = useRef(false)
  const settledRef = useRef(false)
  const timersRef = useRef<number[]>([])
  const pulseCounterRef = useRef(0)

  useEffect(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
    nodeOverridesRef.current = new Map()
    edgeOverridesRef.current = new Map()
    activeRef.current = !!scene
    settledRef.current = !scene
    forceTick((t) => t + 1)

    if (!scene) return

    function at(ms: number, fn: () => void) {
      const id = window.setTimeout(() => {
        fn()
        forceTick((t) => t + 1)
      }, ms)
      timersRef.current.push(id)
    }

    pulseCounterRef.current += 1
    const pulseToken = pulseCounterRef.current

    at(ORIGIN_DELAY, () => {
      nodeOverridesRef.current.set(scene.originId, {
        state: scene.originState,
        badge: null,
        pulseToken,
      })
    })

    const levels = Array.from(new Set(scene.edges.map((e) => e.level))).sort(
      (a, b) => a - b,
    )
    let lastEventEnd = ORIGIN_DELAY

    levels.forEach((level, groupIdx) => {
      const edgesAtLevel = scene.edges.filter((e) => e.level === level)
      const groupStart = HOP_BASE + groupIdx * HOP_GAP
      edgesAtLevel.forEach((edge, k) => {
        const t = groupStart + k * EDGE_STAGGER
        at(t, () => {
          edgeOverridesRef.current.set(edge.id, {
            state: edge.state,
            draw: true,
          })
        })
        at(t + NODE_REVEAL_DELAY, () => {
          const node = scene.nodes.find((n) => n.id === edge.target)
          if (node) {
            nodeOverridesRef.current.set(node.id, {
              state: node.state,
              badge: node.badge ?? null,
              pulseToken: 0,
            })
          }
        })
        lastEventEnd = Math.max(lastEventEnd, t + NODE_REVEAL_DELAY)
      })
    })

    at(lastEventEnd + SETTLE_BUFFER, () => {
      activeRef.current = false
      settledRef.current = true
    })

    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id))
      timersRef.current = []
    }
  }, [scene?.key])

  return {
    nodeOverrides: nodeOverridesRef.current,
    edgeOverrides: edgeOverridesRef.current,
    active: activeRef.current,
    settled: settledRef.current,
  }
}
