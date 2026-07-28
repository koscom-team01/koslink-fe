import { StrictMode, startTransition } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'
import './styles.css'

/**
 * 프로덕션 빌드(nginx.conf의 /api/ 프록시가 koslink-backend-app 실 백엔드로
 * 연결해준다)에서는 MSW를 절대 띄우지 않는다. import.meta.env.PROD는 Vite가
 * `vite build` 결과물에 빌드 타임에 심어주는 값이라 별도 환경변수 설정이
 * 필요 없다 — 개발 서버(`vite dev`)에서만 MSW가 /api/* 를 가로챈다.
 */
async function enableMocking() {
  if (import.meta.env.PROD) return
  const { worker } = await import('#/shared/mocks/browser')
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
