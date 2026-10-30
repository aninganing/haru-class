'use client';

import { Toaster } from '@aninganing/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useTrackNavigation } from '@/lib/navigation-history';
import { getQueryClient } from '@/lib/query/get-query-client';

/** 상세(/classes/...)는 CTA 바(약 6rem), 그 외 페이지는 하단 탭(4.5rem) */
const toastOffset = (pathname: string) => (pathname.startsWith('/classes/') ? '6rem' : '4.5rem');

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  const pathname = usePathname();
  useTrackNavigation();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 토스트는 앱 전체에 하나. 모바일 하단 탭·상세 CTA 바에 가리지 않게 그 높이만큼 띄운다 (PC에서는 조금 더 위에 뜰 뿐) */}
      <Toaster offset={toastOffset(pathname)} />
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
