import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // build:check는 .next-check에 빌드해서 실행 중인 dev 서버(.next)와 충돌하지 않게 한다
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  images: {
    // 클래스 썸네일 (시드: https://picsum.photos/seed/<n>/640/480).
    // picsum.photos는 fastly.picsum.photos로 리다이렉트하고, 그 주소에는 ?hmac= 쿼리가 붙으므로 search를 막지 않는다.
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos', port: '', pathname: '/**', search: '' },
      { protocol: 'https', hostname: 'fastly.picsum.photos', port: '', pathname: '/**' },
    ],
  },
};

export default nextConfig;
