import type { Health } from '@haru/contracts';
import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { json, mockFetch } from '@/test/mock-fetch';
import { renderWithQuery } from '@/test/render';
import { HealthStatus } from './HealthStatus';

const ok: Health = { status: 'ok', checks: { database: 'up', redis: 'up' } };

describe('HealthStatus', () => {
  let restore = () => {};
  afterEach(() => restore());

  it('브라우저에서는 /api 프록시를 호출하고 상태 배지를 보여준다', async () => {
    const calls: string[] = [];
    restore = mockFetch((url) => {
      calls.push(url);
      return json(ok);
    });

    renderWithQuery(<HealthStatus />);

    expect(await screen.findByText(/API\s*ok/)).toBeInTheDocument();
    expect(screen.getByText(/DB\s*up/)).toBeInTheDocument();
    expect(calls).toEqual(['/api/health']);
  });

  it('접근성 위반이 없다', async () => {
    restore = mockFetch(() => json(ok));
    const { container } = renderWithQuery(<HealthStatus />);
    await screen.findByText(/API\s*ok/);
    await expectNoA11yViolations(container);
  });

  it('일부가 down이면 그 항목을 표시한다', async () => {
    restore = mockFetch(() => json({ status: 'degraded', checks: { database: 'up', redis: 'down' } }));

    renderWithQuery(<HealthStatus />);

    expect(await screen.findByText(/Redis\s*down/)).toBeInTheDocument();
    expect(screen.getByText(/API\s*degraded/)).toBeInTheDocument();
  });

  it('API가 실패하면 Nest 에러 메시지를 보여준다', async () => {
    restore = mockFetch(() => json({ statusCode: 502, message: 'Bad Gateway' }, 502));

    renderWithQuery(<HealthStatus />);

    expect(await screen.findByText(/API 연결 실패: Bad Gateway/)).toBeInTheDocument();
  });
});
