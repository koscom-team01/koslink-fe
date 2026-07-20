import { createFileRoute } from '@tanstack/react-router'
import { useAtomValue } from 'jotai'
import { viewAtom } from '#/lib/atoms'
import NewsPanel from '#/components/news/NewsPanel'
import MobileNewsBar from '#/components/news/MobileNewsBar'
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
      <MobileNewsBar />
      <NewsPanel />
      <GraphPanel />
      <AnalysisPanel />
    </main>
  )
}
