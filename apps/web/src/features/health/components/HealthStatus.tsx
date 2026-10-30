'use client';

import { Badge, Card } from '@aninganing/react';
import { useQuery } from '@tanstack/react-query';
import { healthQuery } from '@/features/health/api/queries';

const tone = (state: 'up' | 'down') => (state === 'up' ? 'success' : 'danger');

/** 서버 prefetch → hydrate → 브라우저 폴링(/api 프록시 경유)까지 한 번에 확인하는 컴포넌트. */
export function HealthStatus() {
  const { data, error, dataUpdatedAt } = useQuery(healthQuery());

  return (
    <Card>
      <Card.Body>
        <Card.Title>시스템 상태</Card.Title>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {error ? (
            <Badge tone="danger">API 연결 실패: {error.message}</Badge>
          ) : data ? (
            <>
              <Badge tone={data.status === 'ok' ? 'success' : 'danger'}>API {data.status}</Badge>
              <Badge tone={tone(data.checks.database)}>DB {data.checks.database}</Badge>
              <Badge tone={tone(data.checks.redis)}>Redis {data.checks.redis}</Badge>
            </>
          ) : null}
        </div>
        <p style={{ color: 'var(--color-text-subtle)', fontSize: 'var(--font-size-100)' }}>
          10초마다 갱신 · 마지막 갱신 {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('ko-KR') : '-'}
        </p>
      </Card.Body>
    </Card>
  );
}
