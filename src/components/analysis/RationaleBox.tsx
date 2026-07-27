/** 최종 요약 — 영향 기점과 파급된 관련주 수를 한 줄로 정리한 서버 생성 문구. */
export default function RationaleBox({
  finalSummary,
}: {
  finalSummary: string
}) {
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
        최종 요약
      </h3>
      <p
        className="text-[12.5px] leading-[1.62] tracking-[-0.022em]"
        style={{ color: 'var(--n-700)' }}
      >
        {finalSummary}
      </p>
    </div>
  )
}
