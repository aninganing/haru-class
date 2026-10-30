import { Toaster } from '@aninganing/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { mockMatchMedia, mockNavigator } from '@/test/browser-apis';
import { COPIED_MESSAGE, COPY_FAILED_MESSAGE } from '@/features/class/constants/messages';
import { ShareButton } from './ShareButton';

/** 앱에서는 Providers가 Toaster를 한 번 마운트한다 */
const renderShare = () =>
  render(
    <>
      <ShareButton title="성수 도자기" />
      <Toaster />
    </>,
  );

const shareButton = () => screen.getByRole('button', { name: '공유하기' });

describe('ShareButton', () => {
  let restore = () => {};
  afterEach(() => restore());

  it('대표 흐름(키보드): "공유하기" 버튼에 Tab으로 가 Enter → 복사 토스트가 보이고 포커스는 버튼에 남는다', async () => {
    mockMatchMedia([]);
    const share = vi.fn(() => Promise.resolve());
    const writeText = vi.fn(() => Promise.resolve());
    restore = mockNavigator({ share, writeText });

    renderShare();
    await userEvent.tab();
    expect(shareButton()).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    expect(share).not.toHaveBeenCalled();
    expect((await screen.findAllByText(COPIED_MESSAGE)).length).toBeGreaterThan(0);
    expect(shareButton()).toHaveFocus();
  });

  it('복사가 실패하면 "링크 복사하기" 창을 열고 주소를 전체 선택한다', async () => {
    mockMatchMedia([]);
    restore = mockNavigator({ writeText: () => Promise.reject(new Error('denied')) });

    renderShare();
    await userEvent.click(shareButton());

    const dialog = await screen.findByRole('dialog', { name: '링크 복사하기' });
    expect(dialog).toHaveAccessibleDescription(COPY_FAILED_MESSAGE);
    const input = screen.getByLabelText('클래스 주소') as HTMLInputElement;
    expect(input).toHaveValue(window.location.href);
    await waitFor(() => expect(input).toHaveFocus());
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(window.location.href.length);
  });

  it('창을 닫기 버튼이나 Esc로 닫으면 공유 버튼으로 포커스가 돌아온다', async () => {
    mockMatchMedia([]);
    restore = mockNavigator({ writeText: () => Promise.reject(new Error('denied')) });

    renderShare();
    await userEvent.click(shareButton());
    await screen.findByRole('dialog');
    await userEvent.click(screen.getByRole('button', { name: '닫기' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(shareButton()).toHaveFocus());

    await userEvent.click(shareButton());
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(shareButton()).toHaveFocus());
  });

  it('접근성 위반이 없다 (복사 실패 창 포함)', async () => {
    mockMatchMedia([]);
    restore = mockNavigator({ writeText: () => Promise.reject(new Error('denied')) });
    renderShare();
    await userEvent.click(shareButton());
    await screen.findByRole('dialog');
    await expectNoA11yViolations(document.body);
  });
});
