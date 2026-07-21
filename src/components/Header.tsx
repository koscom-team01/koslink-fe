import { useAtom } from 'jotai'
import { viewAtom } from '#/lib/atoms'
import { useGraphQuery } from '#/lib/queries'

const TABS = [
  { value: 'map', label: '뉴스맵' },
  { value: 'verify', label: '예측 검증' },
] as const

export default function Header() {
  const [view, setView] = useAtom(viewAtom)
  const { data: graph } = useGraphQuery()

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

      <nav className="flex gap-0.5">
        {TABS.map((tab) => {
          const active = view === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setView(tab.value)}
              className="rounded-[9px] px-3.5 py-2 text-[14.5px] font-semibold"
              style={{
                color: active ? '#fff' : 'var(--n-500)',
                background: active ? 'var(--n-900)' : 'transparent',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>

      <div
        className="ml-auto hidden items-center gap-1.5 text-xs sm:flex"
        style={{ color: 'var(--n-500)' }}
      >
        <i
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: '#0f8a5f' }}
        />
        온톨로지 {graph?.nodes.length ?? 0}개 노드 · {graph?.edges.length ?? 0}
        개 관계
      </div>
    </header>
  )
}
