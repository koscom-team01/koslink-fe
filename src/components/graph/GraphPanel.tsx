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
import { cn } from '#/shared/utils/cn'
import { selectedNewsIdAtom } from '#/shared/store/atoms'
import { highlightedNodeAtom } from '#/store/graph/atoms'
import { useNewsImpactQuery } from '#/apis/analysis/queries'
import { sizeOf } from '#/shared/utils/format'
import { fullLayout, radialLayout, tierOf } from '#/utils/graph/layout'
import type { LayoutPoint } from '#/utils/graph/layout'
import { bfsBuild, buildGraphIndex } from '#/shared/utils/graphIndex'
import type { GraphIndex } from '#/shared/utils/graphIndex'
import { FULL_GRAPH_EDGES, FULL_GRAPH_NODES } from '#/mocks/graph/fullGraph'
import type { Direction } from '#/shared/types'
import type {
  EdgeVisualState,
  NewsImpactGraph,
  NodeVisualState,
  OntologyEdge,
  OntologyNode,
  RelFlowEdge,
  StockFlowNode,
} from '#/types/graph'
import StockNode from './StockNode'
import RelEdge from './RelEdge'
import GraphSearch from './GraphSearch'
import { usePropagation } from '#/hooks/graph/usePropagation'
import type { RevealEdge, RevealNode, Scene } from '#/hooks/graph/usePropagation'
import './graph.css'

// nodeTypes/edgeTypes는 반드시 컴포넌트 바깥(모듈 스코프)에 선언한다.
// 안에 두면 매 렌더마다 새 객체가 되어 그래프 전체가 리마운트된다.
const nodeTypes = { stock: StockNode }
const edgeTypes = { rel: RelEdge }

// 전체 관계망(graph.json) 전용 인덱스 — 뉴스별 파급 경로 뷰가 쓰는 graphIndex(옛
// 데모 데이터)와는 완전히 분리된 데이터셋이다.
export const fullGraphIndex = buildGraphIndex(FULL_GRAPH_NODES, FULL_GRAPH_EDGES)

// 정적 온톨로지 기준으로 결정적으로 계산되는 좌표라 모듈 스코프에서 한 번만
// 계산해 캐시한다. 뷰를 오갈 때마다 재계산하면(성능 낭비는 물론) 노드가 튈 수 있다.
// export해서 NetworkView가 centerId(인트로 하이라이트 기점)를 재계산 없이 가져다 쓴다.
export const FULL_LAYOUT = fullLayout(FULL_GRAPH_NODES, fullGraphIndex)

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

export interface Scene2 {
  ids: string[]
  positions: Record<string, LayoutPoint>
  nodes: NodeSpec[]
  edges: EdgeSpec[]
  scene: Scene | null
  ghint: string
  legendMode: 'focus' | 'all'
  backchip: string | null
  /** 이 씬의 노드 메타데이터(marketCap/kind/ticker 등)를 조회할 인덱스.
   * focus 모드는 해당 뉴스의 impactGraph에서 매번 새로 만든 인덱스, all 모드는
   * graph.json 기반 fullGraphIndex — 두 데이터셋이 서로 다른 id 체계라 씬마다
   * 자기 데이터에 맞는 인덱스를 반드시 함께 실어 보내야 한다. */
  index: GraphIndex
}

function polarityEdgeState(polarity: 1 | -1, tier: 1 | 2): EdgeVisualState {
  if (tier === 1) return polarity === -1 ? 'down' : 'up'
  return polarity === -1 ? 'down2' : 'up2'
}

/** 뉴스 파급 경로: 기점 중앙, GET /api/news/{id}/graph로 받은 서브그래프를 BFS로 펼쳐 동심원 배치 */
function buildFocusScene(impactGraph: NewsImpactGraph): Scene2 {
  const index = buildGraphIndex(impactGraph.nodes, impactGraph.edges)
  const built = bfsBuild(index, impactGraph.originId)
  const pos = radialLayout(built.ids, built.level)

  const dirOf = new Map<string, Direction>()
  impactGraph.nodes.forEach((n) => {
    if (n.direction) dirOf.set(n.id, n.direction)
  })

  const nodes: NodeSpec[] = built.ids.map((id) => {
    const isMain = id === impactGraph.originId
    const dir = dirOf.get(id)
    return {
      id,
      isMain,
      restingState: 'hide',
      badge: dir ?? null,
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
    .filter((id) => id !== impactGraph.originId)
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
  const originDirection = dirOf.get(impactGraph.originId) ?? 'UP'

  return {
    ids: built.ids,
    positions: pos,
    nodes,
    edges,
    scene: {
      key: `focus:${impactGraph.newsId}`,
      originId: impactGraph.originId,
      originName: index.byId.get(impactGraph.originId)?.name ?? '',
      originState: originDirection === 'UP' ? 'up' : 'down',
      nodes: revealNodes,
      edges: revealEdges,
    },
    ghint:
      maxHop === 0
        ? '이어진 관련 종목이 확인되지 않았습니다'
        : `기점에서 최대 ${maxHop}단계까지 파급`,
    legendMode: 'focus',
    backchip: null,
    index,
  }
}

/** 전체 관계망: 섹터 3클러스터 고정 좌표. highlightId가 있으면 배치는 그대로 두고 그 자리에서 2단계 파급만 강조. */
export function buildAllScene(
  highlightId: string | null,
  graph: { nodes: OntologyNode[]; edges: OntologyEdge[] },
): Scene2 {
  const { pos } = FULL_LAYOUT
  const ids = graph.nodes.map((n) => n.id)

  if (!highlightId) {
    const nodes: NodeSpec[] = ids.map((id) => ({
      id,
      isMain: false,
      restingState: 'idle',
      badge: null,
      tier: tierOf(fullGraphIndex, id),
    }))
    const edges: EdgeSpec[] = graph.edges.map((e) => ({
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
      index: fullGraphIndex,
    }
  }

  const built = bfsBuild(fullGraphIndex, highlightId, 2)
  const origin = fullGraphIndex.byId.get(highlightId)!

  function ontologyEdgeId(source: string, target: string): string {
    const match = graph.edges.find(
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
    tier: tierOf(fullGraphIndex, id),
  }))
  const edges: EdgeSpec[] = graph.edges.map((e) => ({
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
      originName: origin.name,
      originState: 'origin',
      nodes: revealNodes,
      edges: revealEdges,
    },
    ghint: `${origin.name} · 1단계 ${hop1}개, 2단계 ${hop2}개로 파급`,
    legendMode: 'all',
    backchip: '← 전체 보기',
    index: fullGraphIndex,
  }
}

interface GraphCanvasProps {
  scene2: Scene2
  mode: 'focus' | 'all'
  title?: string
}

export function GraphCanvas({
  scene2,
  mode,
  title = '관계 그래프',
}: GraphCanvasProps) {
  // 씬마다 자기 데이터에 맞는 인덱스를 실어 보낸다(focus=뉴스별 impactGraph,
  // all=graph.json) — 두 데이터셋의 id 체계가 다르므로 고정된 전역 인덱스를
  // 쓰면 다른 쪽 모드에서 노드를 못 찾아 undefined.marketCap 등으로 터진다.
  const index = scene2.index
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const [highlightedNode, setHighlightedNode] = useAtom(highlightedNodeAtom)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [tip, setTip] = useState<{
    x: number
    y: number
    node: OntologyNode
  } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const prevNodesRef = useRef(new Map<string, StockFlowNode>())
  const prevEdgesRef = useRef(new Map<string, RelFlowEdge>())

  const { nodeOverrides, edgeOverrides, stageText, tick, settled } =
    usePropagation(scene2.scene)

  // mode==='focus'(뉴스 파급 경로, GraphPanel)는 지금까지처럼 항상 전체 노드에
  // 즉시 fitView한다 — 아래 서브그래프 확대 줌은 mode==='all'(전체 관계망,
  // NetworkView)에서만 적용한다.
  //
  // mode==='all'에서 하이라이트가 없으면(전체 보기) 전체 노드에 즉시 맞추고,
  // 하이라이트 중(scene2.scene 존재)이면 리빌 애니메이션이 끝나(settled)
  // 진정될 때까지는 줌을 건드리지 않고 기존 화면 그대로 하이라이트가 퍼지는
  // 걸 보여준 뒤, 다 끝나면 그제서야 기점+리빌 노드로만 fitView를 좁혀
  // 보기 좋은 크기로 줌인한다. SK하이닉스처럼 연결이 아주 많은 허브는 리빌
  // 노드 전부를 담으려 하면 다시 확 줌아웃돼 버리므로, minZoom으로 하한선을
  // 둬 일부 노드가 화면 밖으로 밀려나더라도 카드가 잘 보이는 크기 밑으로는
  // 안 내려가게 한다.
  useEffect(() => {
    if (mode !== 'all') {
      const id = window.setTimeout(
        () => fitView({ padding: 0.2, duration: 400 }),
        60,
      )
      return () => window.clearTimeout(id)
    }

    const scene = scene2.scene
    if (scene && !settled) return

    const targetNodes = scene
      ? [scene.originId, ...scene.nodes.map((n) => n.id)].map((id) => ({ id }))
      : undefined
    const id = window.setTimeout(
      () =>
        fitView({
          padding: 0.2,
          duration: 400,
          ...(targetNodes ? { nodes: targetNodes, minZoom: 1 } : {}),
        }),
      60,
    )
    return () => window.clearTimeout(id)
  }, [fitView, mode, scene2.scene?.key, scene2.ids.length, settled])

  // scene2/override가 실제로 바뀔 때만 재계산한다. React Flow는 노드/엣지를 id별로
  // 내부 스토어에 구독시키기 때문에, 값이 같아도 매 틱마다 전체 배열을 새 객체로
  // 만들면 안 바뀐 노드까지 새 참조로 바뀌어(연결된 엣지의 위치 셀렉터까지 흔들려)
  // .ep.draw 애니메이션이 계속 재시작된다 — 바뀐 노드만 새로 만들고 나머지는
  // 이전 렌더의 객체를 그대로 재사용한다.
  const nodes: StockFlowNode[] = useMemo(() => {
    const nextPrev = new Map<string, StockFlowNode>()
    const list = scene2.nodes.map((spec) => {
      const override = nodeOverrides.get(spec.id)
      const state = override?.state ?? spec.restingState
      const badge = override?.badge ?? spec.badge
      const pulseToken = override?.pulseToken

      const prev = prevNodesRef.current.get(spec.id)
      if (
        prev &&
        prev.data.tier === spec.tier &&
        prev.data.state === state &&
        prev.data.isMain === spec.isMain &&
        prev.data.badge === badge &&
        prev.data.pulseToken === pulseToken
      ) {
        nextPrev.set(spec.id, prev)
        return prev
      }

      const ontologyNode = index.byId.get(spec.id)!
      const size = sizeOf(ontologyNode)
      const node: StockFlowNode = {
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
          abstract: ontologyNode.kind !== 'STOCK',
          tier: spec.tier,
          state,
          // .main은 파급 경로 뷰의 상승/하락 색 위에 강조 링을 더하는 용도라
          // origin(탐색 기점) 상태에는 절대 겹쳐 쓰지 않는다 — 겹치면 검은 링이
          // .nd.main의 주황 box-shadow에 덮여 사라진다.
          isMain: spec.isMain,
          badge,
          pulseToken,
        },
      }
      nextPrev.set(spec.id, node)
      return node
    })
    prevNodesRef.current = nextPrev
    return list
  }, [scene2, nodeOverrides, tick, index])

  // 각 엣지 객체는 실제로 상태가 바뀐 것만 새로 만들고, 나머지는 이전 렌더의
  // 객체를 그대로 재사용한다. React Flow는 엣지를 id별로 구독하기 때문에, 값은
  // 같아도 매번 새 객체를 주면 안 바뀐 엣지까지 다시 그려져 .ep.draw 애니메이션이
  // 재시작된다(엣지가 계속 깜빡이는 것처럼 보이는 원인).
  const edges: RelFlowEdge[] = useMemo(() => {
    const nextPrev = new Map<string, RelFlowEdge>()
    const list = scene2.edges.map((spec) => {
      const override = edgeOverrides.get(spec.id)
      const state = override?.state ?? spec.restingState
      const finalState: EdgeVisualState =
        mode === 'all' &&
        !highlightedNode &&
        hoverId &&
        (spec.source === hoverId || spec.target === hoverId)
          ? 'near'
          : state
      const draw = !!override?.draw
      const drawAt = override?.drawAt

      const prev = prevEdgesRef.current.get(spec.id)
      if (
        prev?.data &&
        prev.source === spec.source &&
        prev.target === spec.target &&
        prev.data.relation === spec.relation &&
        prev.data.state === finalState &&
        prev.data.draw === draw &&
        prev.data.drawAt === drawAt
      ) {
        nextPrev.set(spec.id, prev)
        return prev
      }

      const polarity =
        index.relationByKey.get(
          [spec.source, spec.target].sort().join('|'),
        )?.polarity ?? 1
      const edge: RelFlowEdge = {
        id: spec.id,
        source: spec.source,
        target: spec.target,
        type: 'rel',
        data: {
          relation: spec.relation,
          state: finalState,
          draw,
          drawAt,
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
      nextPrev.set(spec.id, edge)
      return edge
    })
    prevEdgesRef.current = nextPrev
    return list
  }, [scene2, edgeOverrides, tick, mode, highlightedNode, hoverId, index])

  // 노드 클릭은 전체 관계망(all 모드)에서 그 자리 강조를 켜고 끄는 용도로만 쓰인다
  // — 파급 경로 뷰는 클릭에 반응하지 않는다.
  const goBack = useCallback(() => {
    setHighlightedNode(null)
  }, [setHighlightedNode])

  const handleNodeClick: NodeMouseHandler<Node> = useCallback(
    (_event, node) => {
      if (mode !== 'all' || highlightedNode === node.id) return
      setHighlightedNode(node.id)
    },
    [mode, highlightedNode, setHighlightedNode],
  )

  const handleNodeEnter: NodeMouseHandler<Node> = useCallback(
    (event, node) => {
      const ontologyNode = index.byId.get(node.id)
      if (!ontologyNode || !canvasRef.current) return
      if (mode === 'all' && !highlightedNode) setHoverId(node.id)
      const rect = canvasRef.current.getBoundingClientRect()
      setTip({
        x: event.clientX - rect.left + 16,
        y: event.clientY - rect.top - 10,
        node: ontologyNode,
      })
    },
    [mode, highlightedNode, index],
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
        <h2>{title}</h2>
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
        {mode === 'all' && (
          <GraphSearch index={index} onSelect={setHighlightedNode} />
        )}
        <div className={cn('stage', stageText && 'on')}>{stageText}</div>
        {tip && (
          <div className="tip on" style={{ left: tip.x, top: tip.y }}>
            <b>{tip.node.name}</b>{' '}
            {tip.node.ticker ? `· ${tip.node.ticker}` : `· ${tip.node.kind}`}
            <br />
            연결 관계 {index.adjacency.get(tip.node.id)?.length ?? 0}건
          </div>
        )}
        <Legend mode={scene2.legendMode} />
      </div>
    </>
  )
}

function Legend({ mode }: { mode: 'focus' | 'all' }) {
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
  const selectedNewsId = useAtomValue(selectedNewsIdAtom)
  const { data: impact } = useNewsImpactQuery(selectedNewsId)
  const impactGraph = impact?.graph

  const scene2: Scene2 | null = useMemo(() => {
    if (selectedNewsId && impactGraph) return buildFocusScene(impactGraph)
    return null
  }, [selectedNewsId, impactGraph])

  return (
    <section className="panel col-graph">
      <ReactFlowProvider>
        {scene2 ? (
          <GraphCanvas scene2={scene2} mode="focus" />
        ) : (
          <div
            className="pbody flex items-center justify-center text-sm font-medium"
            style={{ color: 'var(--n-600)' }}
          >
            뉴스를 선택하면 파급 경로가 나타납니다
          </div>
        )}
      </ReactFlowProvider>
    </section>
  )
}
