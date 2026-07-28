import { useMemo } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { useAtomValue } from 'jotai'
import { highlightedNodeAtom } from '#/lib/atoms'
import { useGraphQuery } from '#/lib/queries'
import { GraphCanvas, buildAllScene } from './GraphPanel'
import type { Scene2 } from './GraphPanel'
import './graph.css'

/** GNB "전체 관계망" 탭 — GraphPanel의 파급 경로 뷰와 별개로, 온톨로지 전체를
 * 뉴스맵 3분할 레이아웃 밖 큰 화면에 보여준다. 노드 클릭 시 제자리 강조하는
 * highlightedNodeAtom은 GraphCanvas와 공유해 씬 계산과 상호작용을 동기화한다. */
export default function NetworkView() {
  const highlightedNode = useAtomValue(highlightedNodeAtom)
  const { data: graph } = useGraphQuery()

  const scene2: Scene2 | null = useMemo(() => {
    if (!graph) return null
    return buildAllScene(highlightedNode, graph)
  }, [highlightedNode, graph])

  return (
    <section className="panel col-graph">
      <ReactFlowProvider>
        {scene2 ? (
          <GraphCanvas scene2={scene2} mode="all" title="전체 관계망" />
        ) : (
          <div
            className="pbody flex items-center justify-center text-sm font-medium"
            style={{ color: 'var(--n-600)' }}
          >
            불러오는 중…
          </div>
        )}
      </ReactFlowProvider>
    </section>
  )
}
