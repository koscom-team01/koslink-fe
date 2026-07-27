import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useAtom, useAtomValue } from 'jotai'
import { motion } from 'motion/react'
import { selectedNewsIdAtom, viewAtom } from '#/lib/atoms'
import { getNews } from '#/lib/api'
import Header from '#/components/Header'
import BriefingSheet from '#/components/briefing/BriefingSheet'
import NewsPanel from '#/components/news/NewsPanel'
import MobileNewsBar from '#/components/news/MobileNewsBar'
import GraphPanel from '#/components/graph/GraphPanel'
import AnalysisPanel from '#/components/analysis/AnalysisPanel'
import VerifyView from '#/components/verify/VerifyView'

export const Route = createFileRoute('/app')({ component: KoslinkApp })

function KoslinkApp() {
  const view = useAtomValue(viewAtom)
  const [selectedNewsId, setSelectedNewsId] = useAtom(selectedNewsIdAtom)

  // 처음 진입하면 최신 뉴스를 바로 시각화한다 (docs/koslink.html의 select(NEWS[0])와 동일)
  useEffect(() => {
    if (selectedNewsId) return
    setSelectedNewsId(getNews().items[0].id)
  }, [selectedNewsId, setSelectedNewsId])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <Header />
      {view === 'verify' ? (
        <main className="view verify">
          <VerifyView />
        </main>
      ) : (
        <main className="view map">
          <MobileNewsBar />
          <NewsPanel />
          <GraphPanel />
          <AnalysisPanel />
        </main>
      )}
      <BriefingSheet />
    </motion.div>
  )
}
