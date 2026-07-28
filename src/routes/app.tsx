import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useAtom, useAtomValue } from 'jotai'
import { motion } from 'motion/react'
import { selectedNewsIdAtom, viewAtom } from '#/shared/store/atoms'
import { useNewsQuery } from '#/apis/news/queries'
import Header from '#/shared/components/Header'
import ScrapSheet from '#/components/scrap/ScrapSheet'
import NewsPanel from '#/components/news/NewsPanel'
import MobileNewsBar from '#/components/news/MobileNewsBar'
import GraphPanel from '#/components/graph/GraphPanel'
import NetworkView from '#/components/graph/NetworkView'
import AnalysisPanel from '#/components/analysis/AnalysisPanel'
import VerifyView from '#/components/verify/VerifyView'

export const Route = createFileRoute('/app')({ component: KoslinkApp })

function KoslinkApp() {
  const view = useAtomValue(viewAtom)
  const [selectedNewsId, setSelectedNewsId] = useAtom(selectedNewsIdAtom)
  // NewsPanel도 같은 쿼리 키(['news'])를 쓰므로 캐시를 공유해 중복 요청되지 않는다.
  const { data: newsPages } = useNewsQuery()
  const firstNewsId = newsPages?.pages[0]?.items[0]?.id

  // 처음 진입하면 실제로 받아온 뉴스 목록의 첫 건을 바로 시각화한다(docs/koslink.html의
  // select(NEWS[0])와 동일) — mock 함수를 직접 부르면 실 배포에서도 목데이터의 첫 id로
  // 고정돼버리므로 반드시 이 쿼리 결과를 써야 한다.
  useEffect(() => {
    if (selectedNewsId || !firstNewsId) return
    setSelectedNewsId(firstNewsId)
  }, [selectedNewsId, firstNewsId, setSelectedNewsId])

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
      ) : view === 'network' ? (
        <main className="view network">
          <NetworkView />
        </main>
      ) : (
        <main className="view map">
          <MobileNewsBar />
          <NewsPanel />
          <GraphPanel />
          <AnalysisPanel />
        </main>
      )}
      <ScrapSheet />
    </motion.div>
  )
}
