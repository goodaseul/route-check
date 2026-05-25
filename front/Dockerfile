# 1단계: 의존성 설치 및 빌드 스테이지
FROM node:20-alpine AS builder
WORKDIR /app

# 라이브러리 목록 복사 및 설치 (캐싱 최적화)
COPY package.json ./
RUN npm install

# 전체 소스 코드 복사 후 Next.js 빌드
COPY . .
RUN npm run build

# 2단계: 실행 전용 경량화 스테이지
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 빌드 결과물과 필요한 파일만 쏙 골라서 복사 (이미지 용량 다이어트)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "run", "start"]