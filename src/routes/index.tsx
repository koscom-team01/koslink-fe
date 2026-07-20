import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: KoslinkApp })

function KoslinkApp() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-5 py-10">
      <p style={{ color: 'var(--n-500)' }}>뉴스맵을 불러오는 중입니다…</p>
    </main>
  )
}
