'use client';

import { Tabs } from '@aninganing/react';
import type { ClassDetail } from '@haru/contracts';
import { useState } from 'react';
import { formatOffset } from '@/features/class/utils/format';

const TABS = [
  { value: 'intro', label: '소개' },
  { value: 'curriculum', label: '커리큘럼' },
  { value: 'location', label: '위치' },
  { value: 'reviews', label: '후기' },
] as const;
type TabValue = (typeof TABS)[number]['value'];

type TabsDetail = Pick<
  ClassDetail,
  'description' | 'learnings' | 'inclusions' | 'curriculum' | 'location' | 'locationNote'
>;

/**
 * 소개·커리큘럼·위치·후기 탭 (DS Tabs = Radix, 방향키 이동).
 * 모든 패널을 forceMount로 그리고 선택되지 않은 패널만 hidden으로 숨긴다 — 네 탭 내용이 모두 SSR HTML에 들어간다(SEO).
 * Radix는 forceMount일 때 hidden=false를 넣지만, 넘긴 props가 그 뒤에 spread되어 우리 hidden이 이긴다.
 */
export function ClassInfoTabs({ detail }: { detail: TabsDetail }) {
  const [tab, setTab] = useState<TabValue>('intro');

  const panel = (value: TabValue) => ({
    value,
    forceMount: true as const,
    hidden: tab !== value,
    className: 'pt-5',
  });

  return (
    // 탭 묶음에 제목을 준다 (WCAG 1.3.1). 화면에는 탭 자체가 제목 역할을 하므로 sr-only
    <section className="lg:col-start-1" aria-labelledby="class-info-title">
      <h2 id="class-info-title" className="sr-only">
        클래스 정보
      </h2>
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <Tabs.List aria-labelledby="class-info-title">
          {TABS.map((t) => (
            <Tabs.Tab key={t.value} value={t.value}>
              {t.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <Tabs.Panel {...panel('intro')}>
          <div className="*:mb-2 *:leading-relaxed *:wrap-anywhere">
            {detail.description
              .split('\n')
              .filter((line) => line.trim() !== '')
              .map((line, i) => (
                <p key={i}>{line}</p>
              ))}
          </div>
          {detail.learnings.length > 0 && (
            <>
              <h3 className="mt-6 mb-3 text-200 font-semibold">이런 걸 배워요</h3>
              <ol className="grid list-inside list-decimal gap-2 text-100 marker:font-bold marker:text-fg-accent">
                {detail.learnings.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </>
          )}
          {detail.inclusions && (
            <>
              <h3 className="mt-6 mb-3 text-200 font-semibold">포함 사항</h3>
              <p className="text-100 text-fg-subtle">{detail.inclusions}</p>
            </>
          )}
        </Tabs.Panel>

        <Tabs.Panel {...panel('curriculum')}>
          {detail.curriculum.length === 0 ? (
            <p className="text-100 text-fg-subtle">커리큘럼을 준비하고 있어요.</p>
          ) : (
            <ol className="grid gap-3">
              {detail.curriculum.map((item) => (
                <li key={`${item.offsetMinutes}-${item.title}`} className="flex gap-4">
                  <span className="min-w-10 font-semibold text-fg-accent tabular-nums">
                    {formatOffset(item.offsetMinutes)}
                  </span>
                  <span>{item.title}</span>
                </li>
              ))}
            </ol>
          )}
        </Tabs.Panel>

        <Tabs.Panel {...panel('location')}>
          <p>{detail.location}</p>
          <p className="text-100 text-fg-subtle">{detail.locationNote}</p>
        </Tabs.Panel>

        <Tabs.Panel {...panel('reviews')}>
          <p className="text-100 text-fg-subtle">아직 후기가 없어요. 첫 수강 후 남겨 주세요.</p>
        </Tabs.Panel>
      </Tabs>
    </section>
  );
}
