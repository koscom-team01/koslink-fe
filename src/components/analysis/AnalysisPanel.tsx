import { useAtom, useAtomValue } from 'jotai'
import { selectedNewsIdAtom, verifyContextAtom, viewAtom } from '#/lib/atoms'
import { useNewsAnalysisQuery, useNewsQuery } from '#/lib/queries'
import MainStockCard from './MainStockCard'
import RelatedList from './RelatedList'
import RationaleBox from './RationaleBox'

export default function AnalysisPanel() {
  const selectedNewsId = useAtomValue(selectedNewsIdAtom)
  const [, setVerifyContext] = useAtom(verifyContextAtom)
  const [, setView] = useAtom(viewAtom)

  const { data: newsList = [] } = useNewsQuery('전체')
  const { data: analysis } = useNewsAnalysisQuery(selectedNewsId)
  const newsItem = selectedNewsId
    ? newsList.find((n) => n.id === selectedNewsId)
    : undefined

  function openVerifyForThisNews() {
    if (!analysis || !newsItem) return
    setVerifyContext({
      label: newsItem.title,
      names: [analysis.main.name, ...analysis.related.map((r) => r.name)],
    })
    setView('verify')
  }

  return (
    <aside className="panel col-panel">
      <div className="phead">
        <h2>영향 분석</h2>
        <p>
          {analysis
            ? `${newsItem?.sector ?? ''} · 영향 종목 ${analysis.related.length + 1}개`
            : '뉴스 선택 대기 중'}
        </p>
      </div>
      <div className="pbody">
        {!analysis ? (
          <div
            className="px-6 py-16 text-center"
            style={{ color: 'var(--n-500)' }}
          >
            <b
              className="mb-[7px] block text-[15px] font-bold"
              style={{ color: 'var(--n-600)' }}
            >
              뉴스를 선택해 주세요
            </b>
            <p className="text-[13px] leading-[1.6]">
              선택한 뉴스가 어떤 종목까지
              <br />
              이어지는지 단계별로 보여드립니다
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            <section
              className="border-b px-[18px] py-4"
              style={{ borderColor: 'var(--n-100)' }}
            >
              <div
                className="mb-[9px] text-[11.5px] font-bold"
                style={{ color: 'var(--n-500)' }}
              >
                기사 요약
              </div>
              <div
                className="flex flex-col gap-[7px] rounded-xl px-3.5 py-[13px]"
                style={{ background: 'var(--n-50)' }}
              >
                {analysis.article.summary.map((line, i) => (
                  <p
                    key={i}
                    className="flex gap-2 text-[13px] leading-[1.6] tracking-[-0.022em]"
                    style={{ color: 'var(--n-600)' }}
                  >
                    <b
                      className="flex-none font-bold"
                      style={{ color: 'var(--n-400)' }}
                    >
                      {i + 1}
                    </b>
                    {line}
                  </p>
                ))}
              </div>
              <div
                className="mt-2.5 flex items-center gap-[7px] text-xs"
                style={{ color: 'var(--n-500)' }}
              >
                <b className="font-semibold" style={{ color: 'var(--n-600)' }}>
                  {analysis.article.press}
                </b>
                <span>·</span>
                <span>
                  {new Date(analysis.article.publishedAt).toLocaleTimeString(
                    'ko-KR',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                    },
                  )}
                </span>
                <a
                  href={analysis.article.originUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto text-xs font-bold hover:underline"
                  style={{ color: 'var(--n-700)' }}
                >
                  원문 열기 ↗
                </a>
              </div>
            </section>

            <section
              className="border-b px-[18px] py-4"
              style={{ borderColor: 'var(--n-100)' }}
            >
              <div
                className="mb-[9px] text-[11.5px] font-bold"
                style={{ color: 'var(--n-500)' }}
              >
                영향 기점
              </div>
              <MainStockCard analysis={analysis} />
            </section>

            <section
              className="border-b px-[18px] py-4"
              style={{ borderColor: 'var(--n-100)' }}
            >
              <RelatedList analysis={analysis} />
            </section>

            <section className="px-[18px] py-4">
              <RationaleBox analysis={analysis} />
            </section>

            <section className="px-[18px] py-4">
              <button
                type="button"
                onClick={openVerifyForThisNews}
                className="w-full rounded-xl border px-3 py-3 text-[13px] font-bold"
                style={{ borderColor: 'var(--n-200)', color: 'var(--n-600)' }}
              >
                이 종목들의 지난 예측 적중률 보기 →
              </button>
            </section>
          </div>
        )}
      </div>
    </aside>
  )
}
