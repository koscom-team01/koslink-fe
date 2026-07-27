import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Provider as JotaiProvider } from 'jotai'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
})

/*
 * GNB(Header)는 여기 두지 않는다 — "/"(커버)는 GNB가 없는 풀블리드 스플래시이고
 * "/app"만 GNB를 갖는다. Header는 src/routes/app.tsx에서 그 라우트 전용으로 렌더링한다.
 */
function RootComponent() {
  return (
    <JotaiProvider>
      <Outlet />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
          TanStackQueryDevtools,
        ]}
      />
    </JotaiProvider>
  )
}
