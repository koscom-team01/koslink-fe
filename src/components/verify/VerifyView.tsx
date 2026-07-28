import { useMemo, useState } from 'react'
import { useAtom } from 'jotai'
import { verifyContextAtom } from '#/lib/atoms'
import { useVerifyQuery } from '#/lib/queries'
import type { VerifyDaily } from '#/types'
import VerifyList, { hitCount } from './VerifyList'
import VerifyDetail from './VerifyDetail'

function VerifyChart({ daily }: { daily: VerifyDaily[] }) {
  const w = 980
  const h = 200
  const pl = 44
  const pr = 16
  const pt = 18
  const pb = 30
  const n = daily.length
  const x = (i: number) => pl + (i * (w - pl - pr)) / Math.max(n - 1, 1)
  const y = (v: number) => pt + (1 - (v - 0.4) / 0.5) * (h - pt - pb)

  const points = daily.map((d, i) => `${x(i)},${y(d.hitRate)}`).join(' ')
  const areaPoints = `${pl},${h - pb} ${points} ${w - pr},${h - pb}`
  const gridLines = [0.4, 0.65, 0.9]
  const axisLabels: [number, string, 'start' | 'middle' | 'end'][] = [
    [0, '30일 전', 'start'],
    [Math.min(10, n - 1), '20일 전', 'middle'],
    [Math.min(20, n - 1), '10일 전', 'middle'],
    [n - 1, '어제', 'end'],
  ]

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: '100%', height: 'auto', marginTop: 6 }}
    >
      {gridLines.map((v) => (
        <g key={v}>
          <line
            x1={pl}
            x2={w - pr}
            y1={y(v)}
            y2={y(v)}
            stroke="#F4F3F1"
            strokeWidth={1}
          />
          <text
            x={pl - 10}
            y={y(v) + 4}
            textAnchor="end"
            fontSize={11}
            fontWeight={500}
            fill="var(--n-500)"
          >
            {Math.round(v * 100)}%
          </text>
        </g>
      ))}
      <polygon points={areaPoints} fill="#FFF4ED" />
      <polyline
        points={points}
        fill="none"
        stroke="#F26722"
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      {daily.map((d, i) =>
        i % 5 === 0 || i === n - 1 ? (
          <circle
            key={i}
            cx={x(i)}
            cy={y(d.hitRate)}
            r={3.6}
            fill="#fff"
            stroke="#F26722"
            strokeWidth={2}
          />
        ) : null,
      )}
      {axisLabels.map(([i, label, anchor]) => (
        <text
          key={label}
          x={x(i)}
          y={h - 9}
          fontSize={11}
          fontWeight={500}
          fill="var(--n-500)"
          textAnchor={anchor}
        >
          {label}
        </text>
      ))}
    </svg>
  )
}

export default function VerifyView() {
  const [ctx, setCtx] = useAtom(verifyContextAtom)
  const [sector, setSector] = useState('전체')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useVerifyQuery(sector)
  const daily = data?.pages[0]?.daily ?? []
  const news = data?.pages.flatMap((p) => p.news) ?? []

  // 섹터는 서버가 커서 페이지 단위로 이미 걸러 보낸다. ctx(관련 종목명)만 로드된
  // 페이지 위에서 클라이언트가 한 번 더 좁힌다.
  const rows = useMemo(
    () =>
      news.filter(
        (v) => !ctx || v.items.some((item) => ctx.names.includes(item.name)),
      ),
    [news, ctx],
  )

  const selectedEntry =
    rows.length === 0
      ? null
      : (rows.find((v) => v.newsId === selectedId) ?? rows[0])

  let hitNewsCount = 0
  let totalItems = 0
  let hitItems = 0
  rows.forEach((v) => {
    const hits = hitCount(v)
    totalItems += v.items.length
    hitItems += hits
    if (hits / v.items.length >= 0.5) hitNewsCount++
  })
  const mHit = rows.length ? Math.round((hitNewsCount / rows.length) * 100) : 0
  const mStock = totalItems ? Math.round((hitItems / totalItems) * 100) : 0

  return (
    <div className="flex h-full min-h-0 flex-col gap-3.5">
      {ctx && (
        <div
          className="flex items-center gap-3 rounded-2xl border px-[13px] py-[13px]"
          style={{ background: 'var(--o-50)', borderColor: 'var(--o-200)' }}
        >
          <span
            className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px] text-sm font-extrabold text-white"
            style={{ background: 'var(--o-500)' }}
          >
            !
          </span>
          <p
            className="text-[13px] leading-[1.5] font-medium"
            style={{ color: 'var(--o-700)' }}
          >
            이번 예측에 등장한{' '}
            <b className="font-extrabold">
              {ctx.names.slice(0, 3).join(' · ')}
              {ctx.names.length > 3 ? ` 외 ${ctx.names.length - 3}종목` : ''}
            </b>
            이 포함된 과거 검증{' '}
            <b className="font-extrabold">{rows.length}건</b>만 보고 있습니다
          </p>
          <button
            type="button"
            onClick={() => setCtx(null)}
            className="ml-auto flex-none rounded-[9px] border bg-white px-3.5 py-2 text-[12.5px] font-bold"
            style={{ borderColor: 'var(--o-200)', color: 'var(--o-700)' }}
          >
            전체 검증 보기
          </button>
        </div>
      )}

      <div
        className="vsumcard overflow-hidden rounded-2xl border bg-white"
        style={{ borderColor: 'var(--n-150)', boxShadow: 'var(--shadow-md)' }}
      >
        <div className="vmets flex flex-col gap-4 px-[22px] py-5">
          <div>
            <div
              className="text-xs font-bold"
              style={{ color: 'var(--n-600)' }}
            >
              뉴스 단위 적중률
            </div>
            <div
              className="mt-[3px] text-[40px] leading-none font-extrabold tracking-[-0.05em]"
              style={{ color: 'var(--o-600)' }}
            >
              {mHit}
              <em
                className="ml-0.5 text-[15px] font-bold not-italic"
                style={{ color: 'var(--n-400)' }}
              >
                %
              </em>
            </div>
            <div
              className="mt-1 text-[11.5px] font-medium"
              style={{ color: 'var(--n-500)' }}
            >
              예측 종목의 절반 이상을 맞힌 뉴스 비율
            </div>
          </div>
          <div>
            <div
              className="text-xs font-bold"
              style={{ color: 'var(--n-600)' }}
            >
              종목 단위 적중률
            </div>
            <div className="mt-[3px] text-[30px] leading-none font-extrabold tracking-[-0.05em]">
              {mStock}
              <em
                className="ml-0.5 text-[15px] font-bold not-italic"
                style={{ color: 'var(--n-400)' }}
              >
                %
              </em>
            </div>
            <div
              className="mt-1 text-[11.5px] font-medium"
              style={{ color: 'var(--n-500)' }}
            >
              예측 방향과 익일 종가 방향 일치
            </div>
          </div>
          <div>
            <div
              className="text-xs font-bold"
              style={{ color: 'var(--n-600)' }}
            >
              검증 완료
            </div>
            <div className="mt-[3px] text-[30px] leading-none font-extrabold tracking-[-0.05em]">
              {rows.length}
              <em
                className="ml-0.5 text-[15px] font-bold not-italic"
                style={{ color: 'var(--n-400)' }}
              >
                건
              </em>
            </div>
            <div
              className="mt-1 text-[11.5px] font-medium"
              style={{ color: 'var(--n-500)' }}
            >
              {ctx ? '관련 검증 건수' : '최근 30일 기준'}
            </div>
          </div>
        </div>
        <div className="min-w-0 px-5 pt-[18px] pb-2.5">
          <h3 className="text-[13.5px] font-bold tracking-[-0.025em]">
            일자별 적중률 추이
          </h3>
          <p
            className="mt-[3px] text-xs font-medium"
            style={{ color: 'var(--n-500)' }}
          >
            최근 30거래일
          </p>
          <VerifyChart daily={daily} />
        </div>
      </div>

      <div className="vsplit">
        <VerifyList
          rows={rows}
          sector={sector}
          onSectorChange={(s) => {
            setSector(s)
            setSelectedId(null)
          }}
          selectedNewsId={selectedEntry?.newsId ?? null}
          onSelect={setSelectedId}
          subtitle={
            ctx
              ? '이번 예측 종목과 겹치는 건만 표시 중'
              : '뉴스를 선택하면 오른쪽에 상세가 나옵니다'
          }
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
        />
        <VerifyDetail entry={selectedEntry} />
      </div>
    </div>
  )
}
