import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * 렌더링 결과에 axe 접근성 위반이 없는지 검사한다.
 * jsdom은 레이아웃을 계산하지 않으므로 색 대비(color-contrast)는 Storybook a11y 애드온에서 확인한다.
 */
export async function expectNoA11yViolations(container: Element) {
  const { violations } = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  const summary = violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`,
  );
  expect(summary, '접근성 위반').toEqual([]);
}
