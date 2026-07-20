import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import type { Node, NodeMouseHandler } from '@xyflow/react'
import '@xyflow/react/dist/style.css' // 필수 — 빠뜨리면 노드가 겹쳐 보인다
import { useAtom, useAtomValue } from 'jotai'
import { cn } from '#/lib/utils'
import {
  backToAtom,
  graphModeAtom,
  highlightedNodeAtom,
  selectedNewsIdAtom,
} from '#/lib/atoms'
import { getNewsAnalysis } from '#/lib/api'
import { ONTOLOGY_EDGES, ONTOLOGY_NODES } from '#/lib/data'
import { sizeOf } from '#/lib/format'
import {
  focusBuild,
  fullLayout,
  graphIndex,
  nodeBuild,
  tierOf,
} from '#/lib/layout'
import type { LayoutPoint } from '#/lib/layout'
import type { Direction, OntologyNode } from '#/types'
import StockNode from './StockNode'
import RelEdge from './RelEdge'
import { usePropagation } from './usePropagation'
import type { RevealEdge, RevealNode, Scene } from './usePropagation'
import type {
  EdgeVisualState,
  NodeVisualState,
  RelFlowEdge,
  StockFlowNode,
} from './types'
import './graph.css'

// nodeTypes/edgeTypes는 반드시 컴포넌트 바깥(모듈 스코프)에 선언한다.
// 안에 두면 매 렌더마다 새 객체가 되어 그래프 전체가 리마운트된다.
const nodeTypes = { stock: StockNode }
const edgeTypes = { rel: RelEdge }

interface EdgeSpec {
  id: string
  source: string
  target: string
  relation: string
  level: number
  restingState: EdgeVisualState
}

interface NodeSpec {
  id: string
  isMain: boolean
  tier?: 't1' | 't2' | 't3'
  restingState: NodeVisualState
  badge: Direction | null
}

interface Scene2 {
  ids: string[]
  positions: Record<string, LayoutPoint>
  nodes: NodeSpec[]
  edges: EdgeSpec[]
  scene: Scene | null
  ghint: string
  legendMode: 'focus' | 'all' | 'node'
  backchip: string | null
  stageLabel: string | null
}

function polarityEdgeState(polarity: 1 | -1, tier: 1 | 2): EdgeVisualState {
  if (tier === 1) return polarity === -1 ? 'down' : 'up'
  return polarity === -1 ? 'down2' : 'up2'
}

/** 뉴스 파급 경로: 기점 중앙, related[].chain 기반 동심원 배치 */
function buildFocusScene(newsId: string): Scene2 | null {
  const analysis = getNewsAnalysis(newsId)
  if (!analysis) return null

  const built = focusBuild(analysis.main.nodeId, analysis.related)
  const dirOf = new Map<string, Direction>()
  dirOf.set(analysis.main.nodeId, analysis.main.direction)
  analysis.related.forEach((r) => dirOf.set(r.nodeId, r.direction))

  const nodes: NodeSpec[] = built.ids.map((id) => {
    const isMain = id === analysis.main.nodeId
    const dir = dirOf.get(id)
    return {
      id,
      isMain,
      restingState: 'hide',
      badge: isMain ? analysis.main.direction : (dir ?? null),
      tier: undefined,
    }
  })

  const edges: EdgeSpec[] = built.pairs.map((p) => ({
    id: `${p.source}__${p.target}`,
    source: p.source,
    target: p.target,
    relation: p.relation,
    level: p.level,
    restingState: 'hide',
  }))

  const revealNodes: RevealNode[] = built.ids
    .filter((id) => id !== analysis.main.nodeId)
    .map((id) => {
      const dir = dirOf.get(id)
      return {
        id,
        level: built.level[id] ?? 1,
        state: dir ? (dir === 'UP' ? 'up' : 'down') : 'via',
        badge: dir ?? null,
      }
    })
  const revealEdges: RevealEdge[] = built.pairs.map((p) => ({
    id: `${p.source}__${p.target}`,
    target: p.target,
    level: p.level,
    state: polarityEdgeState(p.polarity, 1),
  }))

  const maxHop = built.pairs.reduce((m, p) => Math.max(m, p.level), 0)

  return {
    ids: built.ids,
    positions: built.pos,
    nodes,
    edges,
    scene: {
      key: `focus:${newsId}`,
      originId: analysis.main.nodeId,
      originState: analysis.main.direction === 'UP' ? 'up' : 'down',
      nodes: revealNodes,
      edges: revealEdges,
    },
    ghint: `기점에서 최대 ${maxHop}단계까지 파급 · 노드를 클릭하면 그 종목 기점으로 탐색합니다`,
    legendMode: 'focus',
    backchip: null,
    stageLabel: `${graphIndex.byId.get(analysis.main.nodeId)?.name ?? ''} 파급 경로`,
  }
}

/** 종목 기점 탐색: 임의 노드 기점 BFS 2단계 재배치 (배지·방향 없이 경유만 표시) */
function buildNodeScene(originId: string, backLabel: string): Scene2 {
  const built = nodeBuild(originId, 2)
  const origin = graphIndex.byId.get(originId)!

  const nodes: NodeSpec[] = built.ids.map((id) => ({
    id,
    isMain: id === originId,
    restingState: 'hide',
    badge: null,
    tier: undefined,
  }))
  const edges: EdgeSpec[] = built.pairs.map((p) => ({
    id: `${p.source}__${p.target}`,
    source: p.source,
    target: p.target,
    relation: p.relation,
    level: p.level,
    restingState: 'hide',
  }))

  const revealNodes: RevealNode[] = built.ids
    .filter((id) => id !== originId)
    .map((id) => ({
      id,
      level: built.level[id],
      state: built.level[id] === 1 ? 'via' : 'idle',
      badge: null,
    }))
  const revealEdges: RevealEdge[] = built.pairs.map((p) => ({
    id: `${p.source}__${p.target}`,
    target: p.target,
    level: p.level,
    state: polarityEdgeState(p.polarity, 1),
  }))

  const hop1 = Object.values(built.level).filter((l) => l === 1).length
  const hop2 = Object.values(built.level).filter((l) => l === 2).length

  return {
    ids: built.ids,
    positions: built.pos,
    nodes,
    edges,
    scene: {
      key: `node:${originId}`,
      originId,
      originState: 'origin',
      nodes: revealNodes,
      edges: revealEdges,
    },
    ghint: `${origin.name} 기점 · 1단계 ${hop1}개, 2단계까지 ${hop1 + hop2}개 · 다른 노드를 클릭하면 그 종목으로 이동합니다`,
    legendMode: 'node',
    backchip: backLabel,
    stageLabel: `${origin.name} 기점 탐색`,
  }
}

/** 전체 관계망: 섹터 3클러스터 고정 좌표. highlightId가 있으면 배치는 그대로 두고 그 자리에서 2단계 파급만 강조. */
function buildAllScene(highlightId: string | null): Scene2 {
  const { pos } = fullLayout()
  const ids = ONTOLOGY_NODES.map((n) => n.id)

  if (!highlightId) {
    const nodes: NodeSpec[] = ids.map((id) => ({
      id,
      isMain: false,
      restingState: 'idle',
      badge: null,
      tier: tierOf(id),
    }))
    const edges: EdgeSpec[] = ONTOLOGY_EDGES.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      relation: e.relation,
      level: 0,
      restingState: 'idle',
    }))
    return {
      ids,
      positions: pos,
      nodes,
      edges,
      scene: null,
      ghint:
        '진한 카드일수록 연결이 많은 핵심 노드입니다 · 노드를 클릭해 보세요',
      legendMode: 'all',
      backchip: null,
      stageLabel: null,
    }
  }

  const built = nodeBuild(highlightId, 2)
  const origin = graphIndex.byId.get(highlightId)!

  function ontologyEdgeId(source: string, target: string): string {
    const match = ONTOLOGY_EDGES.find(
      (e) =>
        (e.source === source && e.target === target) ||
        (e.source === target && e.target === source),
    )
    return match?.id ?? `${source}__${target}`
  }

  const nodes: NodeSpec[] = ids.map((id) => ({
    id,
    isMain: false,
    restingState: 'dim',
    badge: null,
    tier: tierOf(id),
  }))
  const edges: EdgeSpec[] = ONTOLOGY_EDGES.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    relation: e.relation,
    level: 0,
    restingState: 'dim',
  }))

  const revealNodes: RevealNode[] = built.ids
    .filter((id) => id !== highlightId)
    .map((id) => ({
      id,
      level: built.level[id],
      state: built.level[id] === 1 ? 'via' : 'via2',
      badge: null,
    }))
  const revealEdges: RevealEdge[] = built.pairs.map((p) => ({
    id: ontologyEdgeId(p.source, p.target),
    target: p.target,
    level: p.level,
    state: polarityEdgeState(p.polarity, p.level === 1 ? 1 : 2),
  }))

  const hop1 = Object.values(built.level).filter((l) => l === 1).length
  const hop2 = Object.values(built.level).filter((l) => l === 2).length

  return {
    ids,
    positions: pos,
    nodes,
    edges,
    scene: {
      key: `all-hl:${highlightId}`,
      originId: highlightId,
      originState: 'origin',
      nodes: revealNodes,
      edges: revealEdges,
    },
    ghint: `${origin.name} · 1단계 ${hop1}개, 2단계 ${hop2}개로 파급`,
    legendMode: 'all',
    backchip: '← 전체 보기',
    stageLabel: `${origin.name} 기점 파급`,
  }
}

interface GraphCanvasProps {
  scene2: Scene2
  setNodeFocusId: (id: string | null) => void
}

function GraphCanvas({ scene2, setNodeFocusId }: GraphCanvasProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const [mode, setMode] = useAtom(graphModeAtom)
  const [highlightedNode, setHighlightedNode] = useAtom(highlightedNodeAtom)
  const [backTo, setBackTo] = useAtom(backToAtom)
  const selectedNewsId = useAtomValue(selectedNewsIdAtom)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [tip, setTip] = useState<{
    x: number
    y: number
    node: OntologyNode
  } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const { nodeOverrides, edgeOverrides } = usePropagation(scene2.scene)

  useEffect(() => {
    const id = window.setTimeout(
      () => fitView({ padding: 0.2, duration: 400 }),
      60,
    )
    return () => window.clearTimeout(id)
  }, [fitView, scene2.scene?.key, scene2.ids.length])

  const nodes: StockFlowNode[] = scene2.nodes.map((spec) => {
    const ontologyNode = graphIndex.byId.get(spec.id)!
    const size = sizeOf(ontologyNode)
    const override = nodeOverrides.get(spec.id)
    const state = override?.state ?? spec.restingState
    return {
      id: spec.id,
      type: 'stock',
      position: scene2.positions[spec.id] ?? { x: 0, y: 0 },
      origin: [0.5, 0.5] as [number, number],
      draggable: false,
      selectable: false,
      connectable: false,
      width: size.w,
      height: size.h,
      data: {
        label: ontologyNode.name,
        ticker: ontologyNode.ticker,
        abstract: ontologyNode.kind !== 'COMPANY',
        tier: spec.tier,
        state,
        // .main은 파급 경로 뷰의 상승/하락 색 위에 강조 링을 더하는 용도라
        // origin(탐색 기점) 상태에는 절대 겹쳐 쓰지 않는다 — 겹치면 검은 링이
        // .nd.main의 주황 box-shadow에 덮여 사라진다.
        isMain: spec.isMain,
        badge: override?.badge ?? spec.badge,
        pulseToken: override?.pulseToken,
      },
    }
  })

  const edges: RelFlowEdge[] = scene2.edges.map((spec) => {
    const override = edgeOverrides.get(spec.id)
    const state = override?.state ?? spec.restingState
    const finalState: EdgeVisualState =
      mode === 'all' &&
      !highlightedNode &&
      hoverId &&
      (spec.source === hoverId || spec.target === hoverId)
        ? 'near'
        : state
    const polarity =
      graphIndex.relationByKey.get([spec.source, spec.target].sort().join('|'))
        ?.polarity ?? 1
    return {
      id: spec.id,
      source: spec.source,
      target: spec.target,
      type: 'rel',
      data: {
        relation: spec.relation,
        state: finalState,
        draw: !!override?.draw,
      },
      markerEnd:
        finalState === 'up' ||
        finalState === 'down' ||
        finalState === 'up2' ||
        finalState === 'down2' ||
        finalState === 'near'
          ? {
              type: MarkerType.ArrowClosed,
              width: 15,
              height: 15,
              color: polarity === -1 ? '#0E6E96' : '#F26722',
            }
          : undefined,
    }
  })

  const goBack = useCallback(() => {
    if (backTo === 'reset') {
      setMode('all')
      setHighlightedNode(null)
      setNodeFocusId(null)
      return
    }
    if (backTo === 'focus') {
      setMode('focus')
      setNodeFocusId(null)
      return
    }
    setMode('all')
    setHighlightedNode(null)
    setNodeFocusId(null)
  }, [backTo, setMode, setHighlightedNode])

  const handleNodeClick: NodeMouseHandler<Node> = useCallback(
    (_event, node) => {
      if (mode === 'all') {
        if (highlightedNode === node.id) return
        setHighlightedNode(node.id)
        setBackTo('reset')
        return
      }
      // node 모드에서만 "기점 자기 자신 재클릭"을 막는다 — 파급 경로의 메인 종목은
      // state가 up/down이라 origin이 아니고, 클릭하면 그 종목 기점 탐색으로 넘어간다.
      if (mode === 'node' && node.id === scene2.scene?.originId) return
      if (mode !== 'node') setBackTo('focus')
      setMode('node')
      setNodeFocusId(node.id)
    },
    [
      mode,
      highlightedNode,
      scene2.scene?.originId,
      setHighlightedNode,
      setBackTo,
      setMode,
    ],
  )

  const handleNodeEnter: NodeMouseHandler<Node> = useCallback(
    (event, node) => {
      const ontologyNode = graphIndex.byId.get(node.id)
      if (!ontologyNode || !canvasRef.current) return
      if (mode === 'all' && !highlightedNode) setHoverId(node.id)
      const rect = canvasRef.current.getBoundingClientRect()
      setTip({
        x: event.clientX - rect.left + 16,
        y: event.clientY - rect.top - 10,
        node: ontologyNode,
      })
    },
    [mode, highlightedNode],
  )
  const handleNodeMove: NodeMouseHandler<Node> = useCallback((event) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    setTip((prev) =>
      prev
        ? {
            ...prev,
            x: event.clientX - rect.left + 16,
            y: event.clientY - rect.top - 10,
          }
        : prev,
    )
  }, [])
  const handleNodeLeave: NodeMouseHandler<Node> = useCallback(() => {
    setTip(null)
    // 하이라이트가 켜져 있는 동안은 호버 강조를 지우지 않는다 — 안 그러면 마우스를 떼는 순간 사라진다
    if (highlightedNode) return
    setHoverId(null)
  }, [highlightedNode])

  return (
    <>
      <div className="gbar">
        <h2>관계 그래프</h2>
        <div className="seg">
          <button
            type="button"
            className={cn(mode === 'focus' && 'on')}
            onClick={() => {
              if (!selectedNewsId) return
              setMode('focus')
              setHighlightedNode(null)
              setNodeFocusId(null)
            }}
          >
            파급 경로
          </button>
          <button
            type="button"
            className={cn(mode === 'all' && 'on')}
            onClick={() => {
              setMode('all')
              setHighlightedNode(null)
              setNodeFocusId(null)
            }}
          >
            전체 관계망
          </button>
        </div>
        {scene2.backchip && (
          <button type="button" className="backchip on" onClick={goBack}>
            {scene2.backchip}
          </button>
        )}
        <span className="ghint">{scene2.ghint}</span>
        <div className="gtools">
          <button
            type="button"
            className="gtool"
            onClick={() => zoomIn({ duration: 200 })}
          >
            +
          </button>
          <button
            type="button"
            className="gtool"
            onClick={() => zoomOut({ duration: 200 })}
          >
            −
          </button>
          <button
            type="button"
            className="gtool"
            onClick={() => fitView({ padding: 0.2, duration: 300 })}
          >
            ⤾
          </button>
        </div>
      </div>
      <div className="canvas" ref={canvasRef}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={handleNodeClick}
          onNodeMouseEnter={handleNodeEnter}
          onNodeMouseMove={handleNodeMove}
          onNodeMouseLeave={handleNodeLeave}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.15}
          maxZoom={2.2}
          proOptions={{ hideAttribution: false }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1.2}
            color="#E3E0DC"
          />
        </ReactFlow>
        <div className={cn('stage', scene2.stageLabel && 'on')}>
          {scene2.stageLabel}
        </div>
        {tip && (
          <div className="tip on" style={{ left: tip.x, top: tip.y }}>
            <b>{tip.node.name}</b>{' '}
            {tip.node.ticker ? `· ${tip.node.ticker}` : `· ${tip.node.kind}`}
            <br />
            연결 관계 {graphIndex.adjacency.get(tip.node.id)?.length ?? 0}건
          </div>
        )}
        <Legend mode={scene2.legendMode} />
      </div>
    </>
  )
}

function Legend({ mode }: { mode: 'focus' | 'all' | 'node' }) {
  if (mode === 'node') {
    return (
      <div className="legend">
        <span>
          <i style={{ background: '#F26722' }} />
          동조 관계
        </span>
        <span>
          <i style={{ background: '#0E6E96' }} />
          반대 관계
        </span>
        <span>
          <i style={{ background: '#fff', border: '2px solid #FCA271' }} />
          1단계
        </span>
        <span style={{ color: '#B4AFAA' }}>바깥 원 = 2단계</span>
      </div>
    )
  }
  if (mode === 'all') {
    return (
      <div className="legend">
        <span>
          <i style={{ background: '#44403C' }} />
          핵심 노드
        </span>
        <span>
          <i style={{ background: '#EDEBE8' }} />
          중간
        </span>
        <span>
          <i style={{ background: '#FCFCFB', border: '1px solid #E3E0DC' }} />
          말단
        </span>
        <span style={{ color: '#B4AFAA' }}>
          노드 클릭 = 그 종목 기점 파급 강조
        </span>
      </div>
    )
  }
  return (
    <div className="legend">
      <span>
        <i style={{ background: '#F26722' }} />
        상승
      </span>
      <span>
        <i style={{ background: '#0E6E96' }} />
        하락
      </span>
      <span>
        <i style={{ background: '#fff', border: '2px solid #FCA271' }} />
        경유
      </span>
      <span>
        <i style={{ background: '#F4F3F1', border: '1.5px dashed #D6D3D1' }} />
        테마·제품
      </span>
      <span style={{ color: '#B4AFAA' }}>카드 크기 = 시가총액</span>
    </div>
  )
}

export default function GraphPanel() {
  const [mode, setMode] = useAtom(graphModeAtom)
  const [highlightedNode, setHighlightedNode] = useAtom(highlightedNodeAtom)
  const setBackTo = useAtom(backToAtom)[1]
  const selectedNewsId = useAtomValue(selectedNewsIdAtom)
  const [nodeFocusId, setNodeFocusId] = useState<string | null>(null)

  // 뉴스가 바뀌면 노드 기점 탐색/제자리 강조 상태를 초기화하고 파급 경로 뷰로 돌아간다
  useEffect(() => {
    setNodeFocusId(null)
    setHighlightedNode(null)
    setMode('focus')
    setBackTo('focus')
  }, [selectedNewsId, setBackTo, setHighlightedNode, setMode])

  const scene2: Scene2 | null = useMemo(() => {
    if (mode === 'all') return buildAllScene(highlightedNode)
    if (mode === 'node' && nodeFocusId)
      return buildNodeScene(nodeFocusId, '← 전체 관계망')
    if (selectedNewsId) return buildFocusScene(selectedNewsId)
    return null
  }, [mode, highlightedNode, nodeFocusId, selectedNewsId])

  return (
    <section className="panel col-graph">
      <ReactFlowProvider>
        {scene2 ? (
          <GraphCanvas scene2={scene2} setNodeFocusId={setNodeFocusId} />
        ) : (
          <div
            className="pbody flex items-center justify-center text-sm"
            style={{ color: 'var(--n-500)' }}
          >
            뉴스를 선택하면 파급 경로가 나타납니다
          </div>
        )}
      </ReactFlowProvider>
    </section>
  )
}
