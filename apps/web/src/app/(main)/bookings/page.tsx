import type { Metadata } from 'next';
import { ComingSoon } from '@/components/layout/ComingSoon';

export const metadata: Metadata = { title: '내 예약' };

export default function BookingsPage() {
  return <ComingSoon title="내 예약" description="예약 내역은 곧 여기에서 볼 수 있어요." />;
}
