export default function Header() {
  return (
    <header
      className="sticky top-0 z-40 flex items-center gap-6 border-b px-6"
      style={{
        height: 'var(--gnb-h)',
        borderColor: 'var(--n-150)',
        background: 'rgba(255,255,255,.9)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <div className="flex items-baseline gap-2">
        <b className="text-[19px] font-extrabold tracking-[-0.035em]">
          KOS<span style={{ color: 'var(--o-500)' }}>LINK</span>
        </b>
        <em
          className="text-xs font-normal not-italic"
          style={{ color: 'var(--n-500)' }}
        >
          뉴스로 읽는 종목 관계
        </em>
      </div>
    </header>
  )
}
