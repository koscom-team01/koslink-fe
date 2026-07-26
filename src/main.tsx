import { StrictMode, startTransition } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'
import './styles.css'

/**
 * 아직 실 백엔드가 없으므로 dev든 프로덕션 빌드든 항상 MSW를 띄운다.
 * docs/KOSLINK-FRONTEND.md §11(데모 안전장치)은 "빌드된 정적 파일로 발표한다"고
 * 못박아 두고 있어서, DEV로만 게이팅하면 pnpm build && pnpm preview에서
 * /api/* 요청이 전부 404가 나고 placeholderData가 error 상태로 사라진다.
 * 실 백엔드가 준비되면 VITE_API_BASE_URL을 설정해 이 워커를 끄면 된다.
 */
async function enableMocking() {
  if (import.meta.env.VITE_API_BASE_URL) return
  const { worker } = await import('#/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

const router = getRouter()

enableMocking().then(() => {
  const rootEl = document.getElementById('root')!
  startTransition(() => {
    createRoot(rootEl).render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    )
  })
})
