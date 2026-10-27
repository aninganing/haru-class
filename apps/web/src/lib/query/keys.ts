/** 쿼리 키는 여기서만 만든다. 무효화할 때 같은 함수를 써서 키가 어긋나지 않게 한다. */
export const keys = {
  health: () => ['health'] as const,
};
