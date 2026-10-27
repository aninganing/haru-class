import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // build:check는 .next-check에 빌드해서 실행 중인 dev 서버(.next)와 충돌하지 않게 한다
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
};

export default nextConfig;
