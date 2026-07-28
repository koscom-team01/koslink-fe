import ky from 'ky'

/**
 * 모든 API 호출의 공통 진입점. 항상 같은 오리진의 /api/v1로 붙는다(실 백엔드가
 * 버전 프리픽스를 요구함) — 개발 중에는 MSW가 이 경로를 가로채고, 프로덕션
 * 빌드에서는 nginx.conf의 /api/ 프록시가 실 백엔드(koslink-backend-app)로
 * 그대로 전달한다.
 */
export const http = ky.create({
  prefix: '/api/v1',
  timeout: 10_000,
  retry: { limit: 1 },
})
