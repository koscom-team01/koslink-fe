import { useState } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import {
  briefingRanAtAtom,
  briefingResultAtom,
  briefingTickersAtom,
  selectedNewsIdAtom,
  viewAtom,
} from '#/lib/atoms'
import { runBriefing } from '#/lib/api'
import { impactOf } from '#/lib/format'
import { graphIndex } from '#/lib/layout'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import BriefingFab from './BriefingFab'

const SUGGESTIONS = [
  '한미반도체',
  '삼성전자',
  '에코프로비엠',
  '풍산',
  'LG에너지솔루션',
]
const MAX_TICKERS = 5

export default function BriefingSheet() {
  const [tickers, setTickers] = useAtom(briefingTickersAtom)
  const [result, setResult] = useAtom(briefingResultAtom)
  const [ranAt, setRanAt] = useAtom(briefingRanAtAtom)
  const setSelectedNewsId = useSetAtom(selectedNewsIdAtom)
  const setView = useSetAtom(viewAtom)
  const [inputValue, setInputValue] = useState('')
  const [open, setOpen] = useState(false)

  function addTicker(raw: string) {
    const value = raw.trim()
    if (!value || tickers.includes(value) || tickers.length >= MAX_TICKERS)
      return
    setTickers([...tickers, value])
    setInputValue('')
  }

  function removeTicker(value: string) {
    setTickers(tickers.filter((t) => t !== value))
  }

  function run() {
    if (tickers.length === 0) return
    setResult(runBriefing(tickers))
    setRanAt(
      new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    )
  }

  function clearAll() {
    setTickers([])
    setResult(null)
    setRanAt(null)
  }

  function goToNews(newsId: string) {
    setOpen(false)
    setView('map')
    setSelectedNewsId(newsId)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <BriefingFab matchedCount={result?.matched.length ?? 0} />
      </SheetTrigger>
      <SheetContent className="w-[424px] gap-0 p-0 sm:max-w-[424px]">
        <SheetHeader
          className="border-b px-[22px] pt-5 pb-4"
          style={{ borderColor: 'var(--n-150)' }}
        >
          <SheetTitle className="text-[17px] font-extrabold tracking-[-0.035em]">
            관심종목 브리핑
          </SheetTitle>
          <SheetDescription
            className="text-[12.5px] leading-[1.55]"
            style={{ color: 'var(--n-500)' }}
          >
            보유 종목을 넣으면 오늘 뉴스 중 영향을 주는 건만 역으로 찾아드립니다
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-[22px] py-[18px]">
          <div
            className="flex flex-wrap items-center gap-1.5 rounded-xl border px-3 py-2.5 focus-within:border-[var(--o-500)]"
            style={{ borderColor: 'var(--n-200)' }}
          >
            {tickers.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 rounded-lg py-[5px] pl-[11px] pr-2 text-[12.5px] font-bold"
                style={{ background: 'var(--o-50)', color: 'var(--o-700)' }}
              >
                {t}
                <button
                  type="button"
                  onClick={() => removeTicker(t)}
                  className="text-sm leading-none"
                  style={{ color: 'var(--o-500)' }}
                  aria-label={`${t} 제거`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTicker(inputValue)
                }
              }}
              placeholder="종목명 입력 후 Enter"
              className="min-w-[110px] flex-1 border-none px-0.5 py-[5px] text-[13.5px] outline-none"
            />
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => addTicker(name)}
                className="rounded-lg border px-[11px] py-1.5 text-[12.5px] font-semibold"
                style={{ borderColor: 'var(--n-200)', color: 'var(--n-600)' }}
              >
                + {name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={run}
            className="mt-3.5 w-full rounded-xl py-3.5 text-[14.5px] font-bold text-white"
            style={{ background: 'var(--o-500)' }}
          >
            오늘 뉴스에서 찾기
          </button>

          {!result && tickers.length === 0 && (
            <div
              className="mt-4.5 rounded-[10px] px-3 py-2.5 text-xs"
              style={{ background: 'var(--n-50)', color: 'var(--n-500)' }}
            >
              종목을 1개 이상 추가해 주세요. 위 추천 버튼을 눌러도 됩니다.
            </div>
          )}

          {result && (
            <>
              <div
                className="mt-[18px] flex items-center gap-2 rounded-[10px] px-3 py-2.5 text-xs"
                style={{ background: 'var(--n-50)', color: 'var(--n-500)' }}
              >
                마지막 조회 <b style={{ color: 'var(--n-700)' }}>{ranAt}</b>
                <button
                  type="button"
                  onClick={clearAll}
                  className="ml-auto text-xs font-bold"
                  style={{ color: 'var(--o-600)' }}
                >
                  비우기
                </button>
              </div>

              <p className="my-3 text-sm font-bold leading-[1.6]">
                오늘 뉴스 {result.totalNews}건 중{' '}
                <b style={{ color: 'var(--o-600)' }}>
                  {result.matched.length}건
                </b>
                이 관심종목에 영향을 줍니다
              </p>

              {result.matched.map((m) => {
                const hop = m.chain.length - 1
                const impact = impactOf(hop)
                return (
                  <div
                    key={m.ticker}
                    className="mb-2 rounded-xl border p-3.5"
                    style={{ borderColor: 'var(--n-150)' }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[14.5px] font-bold">{m.name}</span>
                      <span
                        className="rounded-lg px-2.5 py-1 text-[12.5px] font-extrabold text-white"
                        style={{
                          background:
                            m.direction === 'UP'
                              ? 'var(--o-500)'
                              : 'var(--d-500)',
                        }}
                      >
                        {m.direction === 'UP' ? '▲ 상승' : '▼ 하락'}
                      </span>
                    </div>
                    <p
                      className="text-[12.5px] leading-[1.5]"
                      style={{ color: 'var(--n-600)' }}
                    >
                      {m.newsTitle}
                    </p>
                    <p
                      className="mt-2 text-[11.5px]"
                      style={{ color: 'var(--n-500)' }}
                    >
                      <span
                        className="mr-1.5 inline-block rounded-[5px] px-[7px] py-px text-[11px] font-extrabold"
                        style={
                          impact.tier === 't1'
                            ? {
                                background: 'var(--o-100)',
                                color: 'var(--o-700)',
                              }
                            : impact.tier === 't2'
                              ? {
                                  background: 'var(--o-50)',
                                  color: 'var(--o-600)',
                                }
                              : {
                                  background: 'var(--n-100)',
                                  color: 'var(--n-600)',
                                }
                        }
                      >
                        {impact.label}
                      </span>
                      {m.relation}
                      {hop > 0 &&
                        ' · ' +
                          m.chain
                            .map((id) => graphIndex.byId.get(id)?.name ?? id)
                            .join(' → ')}
                    </p>
                    <button
                      type="button"
                      onClick={() => goToNews(m.newsId)}
                      className="mt-[11px] w-full rounded-[9px] border py-2.5 text-[12.5px] font-bold"
                      style={{
                        borderColor: 'var(--n-200)',
                        color: 'var(--n-600)',
                      }}
                    >
                      이 뉴스의 파급 경로 보기 →
                    </button>
                  </div>
                )
              })}

              {result.unmatched.length > 0 && (
                <div
                  className="rounded-xl px-3.5 py-3 text-[12.5px] leading-[1.6]"
                  style={{ background: 'var(--n-50)', color: 'var(--n-500)' }}
                >
                  {result.unmatched.map((u) => u.name).join(' · ')}는 오늘
                  뉴스와 2단계 이내로 연결되지 않았습니다.
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
