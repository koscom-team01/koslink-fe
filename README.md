# KOSLINK (코스링크)

> 뉴스 한 건이 어떤 종목까지 이어지는지, 온톨로지 그래프로 보여주는 서비스

뉴스를 클릭하면 공급망·경쟁·소재 흐름 관계를 따라 영향받는 종목과 그 이유를 그래프로 즉시 보여줍니다. 단순 종목 언급 매칭이 아니라 관계를 2단계 이상 추적하며, 같은 뉴스에서도 상승/하락 종목을 함께 제시합니다.

- 기획 배경 및 상세 내용: [`docs/KOSLINK-PROPOSAL.md`](./docs/KOSLINK-PROPOSAL.md)
- 프론트엔드 구현 가이드: [`docs/KOSLINK-FRONTEND.md`](./docs/KOSLINK-FRONTEND.md)

> ⚠️ 현재 문서는 임시 버전입니다. 개발 진행에 따라 구체화될 예정입니다.

---

## Tech Stack

- **Framework**: TanStack Start (React 19 + Vite SSR)
- **Routing**: TanStack Router (파일 기반)
- **Data Fetching**: TanStack Query
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **HTTP Client**: ky
- **State**: Zustand
- **Graph**: @xyflow/react (React Flow v12) — 예정

## Getting Started

```bash
pnpm install
pnpm dev             # http://localhost:3000
```

| 명령어 | 설명 |
|---|---|
| `pnpm dev` | 개발 서버 실행 (포트 3000) |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm test` | 테스트 실행 (Vitest) |
| `pnpm lint` | ESLint 검사 |
| `pnpm format` | Prettier + ESLint 자동 수정 |
| `pnpm check` | Prettier 검사만 |
| `pnpm generate-routes` | 라우트 트리 생성 |

## 레포 구조

```
src/
├── routes/                       # 파일 기반 라우트
│   ├── __root.tsx                 # 루트 레이아웃 (Header, Footer, devtools)
│   ├── index.tsx                  # 홈
│   └── demo/                      # 데모 페이지 (삭제 가능)
├── components/
│   ├── ui/                        # shadcn 컴포넌트 (예정)
│   ├── news/                      # 뉴스 리스트 / 카드 (예정)
│   ├── graph/                     # React Flow 그래프 (예정)
│   ├── analysis/                  # 영향 분석 패널 (예정)
│   ├── verify/                    # 예측 검증 (예정)
│   ├── briefing/                  # 관심종목 브리핑 시트 (예정)
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── ThemeToggle.tsx
├── lib/
│   └── utils.ts                   # cn() 유틸
├── integrations/
│   └── tanstack-query/            # Query provider 설정
├── styles.css
├── router.tsx
└── routeTree.gen.ts               # 자동 생성 (수정 금지)
docs/                              # 기획/구현 문서
```

`#/*`, `@/*` 모두 `./src/*`로 매핑됩니다.

```ts
import { cn } from '#/lib/utils'
import { cn } from '@/lib/utils'
```

## 디자인 제약

- 주황(`#F26722`)은 그래프 영향 표시 전용 — 버튼/탭 등 장식용 사용 금지
- 신뢰도 퍼센트 미표시 — 영향도는 직접/간접/확산(hop 수)으로만 표현
- 로그인/회원가입/설정 화면 없음, localStorage 미사용
