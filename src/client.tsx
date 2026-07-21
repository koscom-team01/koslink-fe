import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start/client'

/**
 * TanStack Start의 기본 클라이언트 엔트리(node_modules/@tanstack/react-start/
 * dist/plugin/default-entry/client.tsx)를 오버라이드한다. 개발 모드에서는
 * MSW 워커가 뜬 뒤에 하이드레이션을 시작해야 첫 쿼리 요청부터 목 응답을
 * 받는다. import.meta.env.DEV는 프로덕션 빌드에서 false로 인라인되어 이
 * 분기와 동적 import가 통째로 트리쉐이킹된다.
 */
async function enableMocking() {
  if (!import.meta.env.DEV) return
  const { worker } = await import('#/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocking().then(() => {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <StartClient />
      </StrictMode>,
    )
  })
})
