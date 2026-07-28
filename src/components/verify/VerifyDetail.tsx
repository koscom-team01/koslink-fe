import { arrow, directionLabel } from '#/shared/utils/format'
import type { VerifyEntry } from '#/types/verify'
import { hitCount } from './VerifyList'

/** 선택한 검증 뉴스의 적중률 도넛 + 종목별 예측 vs 실제 표 */
export default function VerifyDetail({ entry }: { entry: VerifyEntry | null }) {
  if (!entry) {
    return (
      <div
        className="grid h-full place-items-center rounded-2xl border bg-white p-16 text-center"
        style={{
          borderColor: 'var(--n-150)',
          boxShadow: 'var(--shadow-md)',
          color: 'var(--n-500)',
        }}
      >
        <b
          className="mb-[7px] block text-[15px] font-bold"
          style={{ color: 'var(--n-600)' }}
        >
          선택된 뉴스가 없습니다
        </b>
        <p className="text-[13px] leading-[1.6] font-medium">
          왼쪽 목록에서 뉴스를 골라 주세요
        </p>
      </div>
    )
  }

  const hits = hitCount(entry)
  const pct = Math.round((hits / entry.items.length) * 100)
  const r = 27
  const circumference = 2 * Math.PI * r

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-2xl border bg-white"
      style={{ borderColor: 'var(--n-150)', boxShadow: 'var(--shadow-md)' }}
    >
      <div
        className="flex-none border-b px-[22px] pt-5 pb-[18px]"
        style={{ borderColor: 'var(--n-100)' }}
      >
        <div className="mb-[9px] flex items-center gap-1.5">
          <span
            className="rounded-[5px] px-[7px] py-0.5 text-[11px] font-bold"
            style={{ background: 'var(--n-100)', color: 'var(--n-600)' }}
          >
            {entry.sector}
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: 'var(--n-500)' }}
          >
            {entry.date} 예측 · 익일 종가로 평가
          </span>
        </div>
        <div className="text-lg font-extrabold leading-[1.4] tracking-[-0.035em]">
          {entry.title}
        </div>
        <div
          className="mt-4 flex items-center gap-4 rounded-[13px] border px-4 py-3.5"
          style={{ background: 'var(--o-50)', borderColor: 'var(--o-100)' }}
        >
          <div className="relative h-16 w-16 flex-none">
            <svg viewBox="0 0 64 64" width={64} height={64}>
              <circle
                cx={32}
                cy={32}
                r={r}
                fill="none"
                stroke="#FFE4D3"
                strokeWidth={6}
              />
              <circle
                cx={32}
                cy={32}
                r={r}
                fill="none"
                stroke="#F26722"
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct / 100)}
                transform="rotate(-90 32 32)"
              />
            </svg>
            <b
              className="absolute inset-0 grid place-items-center text-base font-extrabold tracking-[-0.04em]"
              style={{ color: 'var(--o-700)' }}
            >
              {pct}%
            </b>
          </div>
          <div
            className="text-[13px] leading-[1.55] font-medium tracking-[-0.022em]"
            style={{ color: 'var(--o-700)' }}
          >
            예측한 <b className="font-extrabold">{entry.items.length}종목</b>{' '}
            가운데 <b className="font-extrabold">{hits}종목</b>의 방향이
            맞았습니다
            <br />
            온톨로지 경로를 따라 예측한 관련주도 함께 평가했습니다
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-4">
        <div
          className="flex items-center gap-2.5 px-2.5 pt-2.5 pb-2 text-[11px] font-bold"
          style={{ color: 'var(--n-600)' }}
        >
          <span className="flex-1">종목 · 관계 경로</span>
          <span className="w-14">예측</span>
          <span className="w-[68px] text-right">실제 등락</span>
          <span className="w-[50px] text-center">결과</span>
        </div>
        {entry.items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 rounded-[10px] border-t px-2.5 py-[11px]"
            style={{ borderColor: 'var(--n-100)' }}
          >
            <span className="min-w-0 flex-1 text-[13.5px] font-semibold tracking-[-0.025em]">
              {item.name}
              <i
                className="mt-[3px] block text-[11px] font-medium not-italic"
                style={{ color: 'var(--n-500)' }}
              >
                {item.pathLabel}
              </i>
            </span>
            <span
              className="w-14 text-xs font-bold"
              style={{
                color:
                  item.predicted === 'UP' ? 'var(--o-600)' : 'var(--d-600)',
              }}
            >
              {arrow(item.predicted)} {directionLabel(item.predicted)}
            </span>
            <span
              className="w-[68px] text-right text-[13.5px] font-extrabold"
              style={{
                color: item.actualReturn >= 0 ? 'var(--o-600)' : 'var(--d-600)',
              }}
            >
              {item.actualReturn > 0 ? '+' : ''}
              {item.actualReturn.toFixed(2)}%
            </span>
            <span
              className="w-[50px] flex-none rounded-md px-2 py-0.5 text-center text-[11px] font-extrabold"
              style={
                item.hit
                  ? { background: 'var(--o-50)', color: 'var(--o-700)' }
                  : { background: 'var(--n-100)', color: 'var(--n-500)' }
              }
            >
              {item.hit ? '적중' : '미적중'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
