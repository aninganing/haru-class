import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// globals.css의 @theme에 정의한 이름을 알려 줘야 tailwind-merge가 충돌을 올바르게 판단한다.
// (예: text-100은 글자 크기, text-fg-subtle은 색 — 알려 주지 않으면 둘을 같은 그룹으로 보고 하나를 지운다)
const twMerge = extendTailwindMerge({
  override: {
    theme: {
      color: [
        'fg',
        'fg-subtle',
        'fg-accent',
        'fg-danger',
        'fg-inverse',
        'fg-on-brand-subtle',
        'fg-accent-on-inverse',
        'surface',
        'surface-subtle',
        'surface-muted',
        'surface-inverse',
        'line',
        'line-control',
        'focus',
        'brand',
        'brand-hover',
        'brand-subtle',
        'danger',
        'success',
      ],
      text: ['50', '100', '200', '300', '400', '500', '600'],
      font: ['sans', 'mono'],
      'font-weight': ['regular', 'medium', 'semibold', 'bold'],
      leading: ['tight', 'normal', 'relaxed'],
      radius: ['sm', 'md', 'lg', 'full'],
      shadow: ['sm', 'md'],
      breakpoint: ['md', 'lg'],
    },
  },
});

/** 조건부 클래스 합치기 + Tailwind 충돌 정리. 컴포넌트에 className prop을 받을 때 항상 이걸로 합친다. */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
