import { createFileRoute } from '@tanstack/react-router'
import { useAtomValue } from 'jotai'
import { viewAtom } from '#/lib/atoms'
import NewsPanel from '#/components/news/NewsPanel'
import GraphPanel from '#/components/graph/GraphPanel'
import AnalysisPanel from '#/components/analysis/AnalysisPanel'
import VerifyView from '#/components/verify/VerifyView'

export const Route = createFileRoute('/')({ component: KoslinkApp })

function KoslinkApp() {
  const view = useAtomValue(viewAtom)

  if (view === 'verify') {
    return (
      <main className="view">
        <VerifyView />
      </main>
    )
  }

  return (
    <main className="view map">
      {/* TODO(뉴스 패널 구현): ≤1080px에서 여기 상단 현재뉴스 바(MobileNewsBar)가 추가된다 */}
      <NewsPanel />
      <GraphPanel />
      <AnalysisPanel />
    </main>
  )
}
