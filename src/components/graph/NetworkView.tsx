import { useEffect, useMemo } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { useAtom } from 'jotai'
import { introPlayedAtom } from '#/shared/store/atoms'
import { highlightedNodeAtom } from '#/store/graph/atoms'
import { FULL_GRAPH_EDGES, FULL_GRAPH_NODES } from '#/mocks/graph/fullGraph'
import {
  GraphCanvas,
  buildAllScene,
  FULL_LAYOUT,
  fullGraphIndex,
} from './GraphPanel'
import './graph.css'

const FULL_GRAPH = { nodes: FULL_GRAPH_NODES, edges: FULL_GRAPH_EDGES }

/** GNB "전체 관계망" 탭 — GraphPanel의 파급 경로 뷰와 별개로, 온톨로지 전체를
 * 뉴스맵 3분할 레이아웃 밖 큰 화면에 보여준다. graph.json을 정적으로 읽어 쓰며
 * API를 거치지 않는다. 노드 클릭 시 제자리 강조하는 highlightedNodeAtom은
 * GraphCanvas와 공유해 씬 계산과 상호작용을 동기화한다. */
export default function NetworkView() {
  const [highlightedNode, setHighlightedNode] = useAtom(highlightedNodeAtom)
  const [introPlayed, setIntroPlayed] = useAtom(introPlayedAtom)

  // 커버 화면 → /app 최초 진입 시 허브 노드를 자동으로 한 번 하이라이트한다.
  // introPlayedAtom이 전역이라 GNB 탭을 오가며 NetworkView가 재마운트돼도 재생되지 않는다.
  useEffect(() => {
    if (introPlayed || highlightedNode) return
    setHighlightedNode(FULL_LAYOUT.centerId)
    setIntroPlayed(true)
  }, [introPlayed, highlightedNode, setHighlightedNode, setIntroPlayed])

  const scene2 = useMemo(
    () => buildAllScene(highlightedNode, FULL_GRAPH),
    [highlightedNode],
  )

  return (
    <section className="panel col-graph">
      <ReactFlowProvider>
        <GraphCanvas
          scene2={scene2}
          mode="all"
          index={fullGraphIndex}
          title="전체 관계망"
        />
      </ReactFlowProvider>
    </section>
  )
}
