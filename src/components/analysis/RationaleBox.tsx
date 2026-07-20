import type { NewsAnalysis } from '#/types'

const ROWS: {
  key: string
  label: string
  field: keyof NewsAnalysis['rationale']
  html: boolean
}[] = [
  { key: 'event', label: '이벤트', field: 'event', html: false },
  { key: 'propagation', label: '파급 경로', field: 'propagation', html: true },
  { key: 'precedent', label: '과거 사례', field: 'precedent', html: true },
]

/**
 * 판단 근거 3행. propagation/precedent는 서버가 그래프 경로에서 템플릿 생성한
 * 신뢰 가능한 정적 문자열이라 굵게 표시된 종목명을 위해 dangerouslySetInnerHTML을
 * 쓴다(사용자 입력이 섞이지 않는다).
 */
export default function RationaleBox({ analysis }: { analysis: NewsAnalysis }) {
  return (
    <div
      className="rounded-2xl border px-4 py-[15px]"
      style={{ background: 'var(--o-50)', borderColor: 'var(--o-100)' }}
    >
      <h3
        className="mb-[11px] flex items-center gap-[7px] text-[12.5px] font-extrabold"
        style={{ color: 'var(--o-700)' }}
      >
        <span
          className="inline-block h-3 w-[3px] rounded-sm"
          style={{ background: 'var(--o-500)' }}
        />
        판단 근거
      </h3>
      {ROWS.map((row, i) => (
        <div
          key={row.key}
          className="flex gap-2.5 py-2"
          style={i === 0 ? undefined : { borderTop: '1px solid var(--o-100)' }}
        >
          <div
            className="w-[58px] flex-none text-[11.5px] font-extrabold"
            style={{ color: 'var(--o-600)' }}
          >
            {row.label}
          </div>
          {row.html ? (
            <div
              className="text-[12.5px] leading-[1.62] tracking-[-0.022em]"
              style={{ color: 'var(--n-700)' }}
              dangerouslySetInnerHTML={{
                __html: analysis.rationale[row.field],
              }}
            />
          ) : (
            <div
              className="text-[12.5px] leading-[1.62] tracking-[-0.022em]"
              style={{ color: 'var(--n-700)' }}
            >
              {analysis.rationale[row.field]}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
