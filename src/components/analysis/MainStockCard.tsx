import { arrow, directionLabel, impactOf } from '#/lib/format'
import type { OriginStock } from '#/types'

function OriginCard({ stock }: { stock: OriginStock }) {
  const down = stock.direction === 'DOWN'
  const accent = down ? 'var(--d-500)' : 'var(--o-500)'
  const tint = down ? 'var(--d-50)' : 'var(--o-50)'
  const text = down ? 'var(--d-700)' : 'var(--o-700)'
  const border = down ? 'var(--d-100)' : 'var(--o-200)'

  return (
    <div
      className="rounded-[15px] border-2 px-4 py-[15px]"
      style={{ borderColor: accent, background: tint }}
    >
      <div className="flex items-center justify-between gap-2.5">
        <div className="text-lg font-extrabold tracking-[-0.035em]">
          {stock.name}
          <small
            className="ml-1.5 text-xs font-semibold"
            style={{ color: 'var(--n-500)' }}
          >
            {stock.ticker}
          </small>
        </div>
        <span
          className="flex-none rounded-lg px-2.5 py-1 text-[12.5px] font-extrabold text-white"
          style={{ background: accent }}
        >
          {arrow(stock.direction)} {directionLabel(stock.direction)}
        </span>
      </div>
      <span
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border bg-white px-[11px] py-[5px] text-xs font-bold tracking-[-0.02em]"
        style={{ borderColor: border, color: text }}
      >
        {impactOf(0).label}
      </span>
      <p
        className="mt-[11px] text-[12.5px] leading-[1.55] tracking-[-0.022em]"
        style={{ color: text }}
      >
        {stock.reason}
      </p>
    </div>
  )
}

/** 영향 기점 — 뉴스에 직접 언급된 당사자 종목(들). 대부분 1개지만 여러 개일 수 있다. */
export default function MainStockCard({
  originStocks,
}: {
  originStocks: OriginStock[]
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {originStocks.map((stock) => (
        <OriginCard key={stock.ticker} stock={stock} />
      ))}
    </div>
  )
}
