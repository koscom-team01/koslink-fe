import { createFileRoute, useNavigate } from '@tanstack/react-router'
import CoverScreen from '#/components/cover/CoverScreen'

export const Route = createFileRoute('/')({ component: CoverRoute })

function CoverRoute() {
  const navigate = useNavigate()
  return <CoverScreen onEnter={() => navigate({ to: '/app' })} />
}
