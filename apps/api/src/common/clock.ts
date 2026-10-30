/** 현재 시각 공급자. 테스트에서 시간을 고정할 수 있도록 서비스는 `new Date()` 대신 이것을 주입받는다. */
export const CLOCK = Symbol('CLOCK');
export type Clock = () => Date;
export const systemClock: Clock = () => new Date();
