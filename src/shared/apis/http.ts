import ky from 'ky'

/**
 * 모든 API 호출의 공통 진입점. prefix는 VITE_API_BASE_URL이 있으면 그쪽으로,
 * 없으면 같은 오리진의 /api로 붙는다 (개발 중에는 MSW가 이 경로를 가로챈다).
 */
export const http = ky.create({
  prefix: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10_000,
  retry: { limit: 1 },
})
