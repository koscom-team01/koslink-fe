# 1. 빌드 스테이지
FROM node:22-alpine AS builder

# pnpm 패키지 매니저 활성화
RUN corepack enable && corepack prepare pnpm@10.2.1 --activate

WORKDIR /app

# 패키지 매니저 파일 복사 및 의존성 설치 (캐시 활용)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 소스 코드 복사
COPY . .

# 정적 번들 빌드 (/app/dist 가 생성됨) — API 호출은 항상 같은 오리진의 /api로
# 붙고, 쿠버네티스에서는 nginx.conf의 /api/ 프록시가 실 백엔드로 전달한다
RUN pnpm build

# 2. 실행 스테이지 (Nginx)
FROM nginx:alpine

# Nginx 커스텀 설정 파일 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드 결과물 복사
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
