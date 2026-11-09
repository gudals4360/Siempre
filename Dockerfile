# 발표·시연용 배포 이미지: 화면(frontend/dist)과 API(backend)를 한 서버로 내보낸다. 자세한 안내: docs/deploy-demo.md
#   docker build -t siempre .
#   docker run -p 8787:8787 -v siempre-data:/data -e DEMO_LOGIN=1 siempre     → http://localhost:8787

# 1) 화면 빌드. Firebase 웹 설정은 빌드할 때 화면 안에 들어가므로 build-arg로 받는다 (시연 로그인만 쓸 거면 비워도 됨)
FROM node:22-slim AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
RUN npm run build

# 2) 실행: 설치할 패키지 없는 Node 서버 (node:sqlite를 쓰므로 22.13 이상)
FROM node:22-slim
WORKDIR /app
COPY backend/ ./backend/
COPY --from=web /web/dist ./frontend/dist
ENV NODE_ENV=production \
    PORT=8787 \
    STATIC_DIR=/app/frontend/dist \
    DATABASE_URL=/data/siempre.db \
    TRUST_PROXY=1
# SQLite 파일이 들어가는 곳. 호스팅에서 영구 디스크(볼륨)를 /data에 붙여야 재시작해도 회원 정보가 남는다
VOLUME ["/data"]
EXPOSE 8787
CMD ["node", "--disable-warning=ExperimentalWarning", "backend/deploy/serve.js"]
