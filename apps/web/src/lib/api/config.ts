export const ACCESS_TOKEN_COOKIE = 'access_token';

/** Nest API 주소. 서버에서만 읽는다. */
export const getApiUrl = () => {
  const url = process.env.API_URL;
  if (!url) throw new Error('API_URL 환경변수가 없어요 (apps/web/.env.local 확인)');
  return url;
};
