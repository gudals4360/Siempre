import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 사이트가 놓이는 기본 주소. 기본은 '/', GitHub Pages처럼 하위 주소(…github.io/Siempre/)에 올릴 때는 빌드할 때 VITE_BASE=/Siempre/
  base: process.env.VITE_BASE || '/',
  build: {
    // 페이지 두 개: 회원가입·로그인(React, index.html)과 권희수 님 화면(siempre-figma-prototype.html)
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        prototype: resolve(__dirname, 'siempre-figma-prototype.html'),
      },
    },
  },
  server: {
    port: 5173,
    // 화면은 backend/의 API만 부른다. 같은 주소로 보이게 넘겨서 로그인 토큰 요청이 그대로 간다.
    proxy: { '/api': { target: process.env.BACKEND_URL || 'http://localhost:8787' } },
  },
});
