// 발표·시연용 배포: 화면(frontend/dist)과 /api를 한 서버, 한 주소로 내보낸다.
//   1) cd frontend && npm ci && npm run build
//   2) cd backend && npm run start:demo        → http://localhost:8787
// backend/shared/server.js(공용 파일)는 고치지 않는다. 만들어진 서버의 요청 처리 앞에
// "/api가 아니면 정적 파일" 처리만 끼워 넣는다. 화면과 API가 같은 주소라 CORS·프록시 설정이 필요 없다.

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { createApp } from '../shared/server.js';

const BACKEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt']);

const statSafe = (file) => {
  try {
    return fs.statSync(file);
  } catch {
    return null;
  }
};

function plain(res, status, text, headers = {}) {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', 'x-content-type-options': 'nosniff', ...headers });
  res.end(text);
}

/** 정적 파일을 내보낸다. 파일이 없고 확장자도 없는 주소(/login 등)는 React 앱(index.html)으로 보낸다. */
export function createStaticHandler(staticDir) {
  const root = path.resolve(staticDir);
  const gzipCache = new Map(); // 파일 경로+수정시각 → gzip 결과 (같은 파일을 매번 다시 압축하지 않게)

  return function serveStatic(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return plain(res, 405, 'GET만 받아요.', { allow: 'GET, HEAD' });

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    } catch {
      return plain(res, 400, '주소가 잘못됐어요.');
    }
    if (pathname.includes('\0')) return plain(res, 400, '주소가 잘못됐어요.');

    let file = path.join(root, pathname); // path.join이 ../ 를 정리한다
    if (file !== root && !file.startsWith(root + path.sep)) return plain(res, 404, '없는 주소예요.'); // dist 밖은 절대 내보내지 않는다

    let stat = statSafe(file);
    if (stat?.isDirectory()) {
      file = path.join(file, 'index.html');
      stat = statSafe(file);
    }
    if (!stat) {
      if (path.extname(pathname)) return plain(res, 404, '없는 주소예요.'); // 파일 요청인데 없음
      file = path.join(root, 'index.html'); // 앱 안 주소(/login, /signup …)
      stat = statSafe(file);
    }
    if (!stat?.isFile()) return plain(res, 503, '화면이 아직 빌드되지 않았어요. frontend에서 npm run build를 먼저 실행하세요.');

    const ext = path.extname(file).toLowerCase();
    const headers = {
      'content-type': TYPES[ext] || 'application/octet-stream',
      'x-content-type-options': 'nosniff',
      // 해시가 붙은 /assets/ 파일은 오래 캐시, 나머지(html 등)는 매번 확인
      'cache-control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    };

    let body;
    if (COMPRESSIBLE.has(ext) && /\bgzip\b/.test(String(req.headers['accept-encoding'] || ''))) {
      const key = `${file}:${stat.mtimeMs}`;
      if (!gzipCache.has(key)) gzipCache.set(key, zlib.gzipSync(fs.readFileSync(file)));
      body = gzipCache.get(key);
      headers['content-encoding'] = 'gzip';
      headers.vary = 'Accept-Encoding';
    } else {
      body = fs.readFileSync(file);
    }
    headers['content-length'] = body.length;
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : body);
  };
}

/** 백엔드(API) 서버에 정적 파일 처리를 앞에 붙여 한 서버로 만든다 */
export function createDemoServer({ env = process.env, staticDir } = {}) {
  const { server, db, router } = createApp({ env });
  const apiHandler = server.listeners('request')[0];
  const serveStatic = createStaticHandler(staticDir || env.STATIC_DIR || path.join(BACKEND_DIR, '..', 'frontend', 'dist'));
  server.removeAllListeners('request');
  server.on('request', (req, res) => {
    const p = String(req.url || '').split('?')[0];
    if (p === '/api' || p.startsWith('/api/')) return apiHandler(req, res);
    return serveStatic(req, res);
  });
  return { server, db, router };
}

function loadEnv(file) {
  try {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch {
    // .env가 없으면 호스팅의 환경변수만 쓴다
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  loadEnv(path.join(BACKEND_DIR, '.env')); // 호스팅에서 넣은 환경변수가 우선
  const port = Number(process.env.PORT || 8787);
  const staticDir = path.resolve(process.env.STATIC_DIR || path.join(BACKEND_DIR, '..', 'frontend', 'dist'));
  const { server } = createDemoServer({ staticDir });
  server.listen(port, () => {
    console.log(`Siempre 시연 서버(화면 + API): http://localhost:${port}`);
    console.log(`화면 폴더: ${staticDir}${statSafe(path.join(staticDir, 'index.html')) ? '' : '  ⚠️ 아직 빌드되지 않았어요 (frontend에서 npm run build)'}`);
    if (process.env.DEMO_LOGIN === '1') console.warn('⚠️ DEMO_LOGIN=1: 비밀번호 없이 관리자로 들어가는 시연 로그인이 켜져 있어요. 발표가 끝나면 끄거나 서버를 내리세요.');
    if (!process.env.FIREBASE_PROJECT_ID && process.env.DEMO_LOGIN !== '1') console.warn('FIREBASE_PROJECT_ID도 DEMO_LOGIN도 없어 로그인할 수 없어요.');
  });
}
