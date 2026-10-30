import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { LoadTrigger } from './useClassListFeed';
import { useLoadMoreAnnouncement } from './useLoadMoreAnnouncement';

interface Props {
  pageCount: number;
  itemCount: number;
  isEnd: boolean;
  trigger: LoadTrigger;
}

/** 훅이 돌려준 ref를 실제 목록·끝 문구에 붙여 포커스 이동을 확인한다 (ClassList와 같은 구조) */
function Harness(props: Props) {
  const { announcement, listRef, endRef } = useLoadMoreAnnouncement(props);
  return (
    <>
      <ul ref={listRef}>
        {Array.from({ length: props.itemCount }, (_, i) => (
          <li key={i}>
            <a href={`/classes/c${i + 1}`}>클래스 {i + 1}</a>
          </li>
        ))}
      </ul>
      <p ref={endRef} tabIndex={-1}>
        끝
      </p>
      <p role="status">{announcement}</p>
    </>
  );
}

const status = () => screen.getByRole('status');
const link = (n: number) => screen.getByRole('link', { name: `클래스 ${n}` });

describe('useLoadMoreAnnouncement', () => {
  it('첫 페이지(0 → 1페이지)는 알리지 않는다', () => {
    const { rerender } = render(<Harness pageCount={0} itemCount={0} isEnd={false} trigger="auto" />);
    rerender(<Harness pageCount={1} itemCount={2} isEnd={false} trigger="auto" />);

    expect(status()).toHaveTextContent('');
  });

  it('첫 페이지가 마지막이어도 status로 알리지 않는다 (끝 문구는 화면에만)', () => {
    const { rerender } = render(<Harness pageCount={0} itemCount={0} isEnd={false} trigger="auto" />);
    rerender(<Harness pageCount={1} itemCount={1} isEnd trigger="auto" />);

    expect(status()).toHaveTextContent('');
  });

  it('페이지가 늘면 중복을 뺀 뒤 실제로 늘어난 카드 수로 알린다', () => {
    const { rerender } = render(<Harness pageCount={1} itemCount={2} isEnd={false} trigger="auto" />);
    // 다음 페이지 2개 중 1개는 이미 본 클래스라 화면에는 1개만 늘었다
    rerender(<Harness pageCount={2} itemCount={3} isEnd={false} trigger="auto" />);

    expect(status()).toHaveTextContent(/^클래스 1개를 더 불러왔어요$/);
  });

  it('자동 로드로 끝까지 오면 개수와 끝을 함께 알린다', () => {
    const { rerender } = render(<Harness pageCount={1} itemCount={2} isEnd={false} trigger="auto" />);
    rerender(<Harness pageCount={2} itemCount={3} isEnd trigger="auto" />);

    expect(status()).toHaveTextContent(/^클래스 1개를 더 불러왔어요\. 모든 클래스를 다 봤어요$/);
  });

  it('버튼으로 끝까지 오면 끝 문구로 포커스를 옮기고 status에는 끝을 반복하지 않는다', async () => {
    const { rerender } = render(<Harness pageCount={1} itemCount={2} isEnd={false} trigger="button" />);
    rerender(<Harness pageCount={2} itemCount={3} isEnd trigger="button" />);

    await waitFor(() => expect(screen.getByText('끝')).toHaveFocus());
    expect(status()).toHaveTextContent(/^클래스 1개를 더 불러왔어요$/);
  });

  it('버튼으로 불러왔고 끝이 아니면 새로 붙은 첫 항목 링크로 포커스를 옮긴다', async () => {
    const { rerender } = render(<Harness pageCount={1} itemCount={2} isEnd={false} trigger="button" />);
    rerender(<Harness pageCount={2} itemCount={4} isEnd={false} trigger="button" />);

    await waitFor(() => expect(link(3)).toHaveFocus());
    expect(status()).toHaveTextContent('클래스 2개를 더 불러왔어요');
  });

  it('자동 로드(스크롤)로 불러오면 포커스를 옮기지 않는다', async () => {
    const { rerender } = render(<Harness pageCount={1} itemCount={2} isEnd={false} trigger="auto" />);
    link(1).focus();
    rerender(<Harness pageCount={2} itemCount={4} isEnd={false} trigger="auto" />);

    await waitFor(() => expect(status()).toHaveTextContent('클래스 2개를 더 불러왔어요'));
    expect(link(1)).toHaveFocus();
  });

  it('늘어난 카드가 0개(전부 중복)면 개수 안내 없이 포커스도 그대로 둔다', async () => {
    const { rerender } = render(<Harness pageCount={1} itemCount={2} isEnd={false} trigger="button" />);
    link(2).focus();
    rerender(<Harness pageCount={2} itemCount={2} isEnd={false} trigger="button" />);

    await waitFor(() => expect(link(2)).toHaveFocus());
    expect(status()).toHaveTextContent('');
  });

  it('늘어난 카드가 0개인데 자동 로드로 끝이면 끝만 알린다', () => {
    const { rerender } = render(<Harness pageCount={1} itemCount={2} isEnd={false} trigger="auto" />);
    rerender(<Harness pageCount={2} itemCount={2} isEnd trigger="auto" />);

    expect(status()).toHaveTextContent(/^모든 클래스를 다 봤어요$/);
  });

  it('페이지 수가 줄면(400 뒤 처음부터 다시) 이전 안내를 비운다', () => {
    const { rerender } = render(<Harness pageCount={1} itemCount={2} isEnd={false} trigger="auto" />);
    rerender(<Harness pageCount={2} itemCount={4} isEnd={false} trigger="auto" />);
    expect(status()).toHaveTextContent('클래스 2개를 더 불러왔어요');

    rerender(<Harness pageCount={0} itemCount={0} isEnd={false} trigger="button" />);

    expect(status()).toHaveTextContent('');
  });
});
