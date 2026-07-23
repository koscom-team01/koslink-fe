import { StrictMode, startTransition } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'
import './styles.css'

async function enableMocking() {
  if (!import.meta.env.DEV) return
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
