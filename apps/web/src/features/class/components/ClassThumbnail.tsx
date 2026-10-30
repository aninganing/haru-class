'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ImageIcon } from '@/components/ui/icons';

interface ClassThumbnailProps {
  src: string | null;
  /** next/image srcset 선택 기준. 부모 폭에 맞춘다. */
  sizes: string;
  /** 첫 화면의 대표 이미지(LCP)만 켠다. Next 16에서 priority 대신 preload를 쓴다. */
  preload?: boolean;
}

/**
 * 클래스 썸네일. 부모가 position: relative와 크기(aspect-ratio 등)를 가져야 한다.
 * 제목이 바로 옆에 있으므로 이미지는 장식(alt="")으로 둔다.
 * URL이 없거나 불러오지 못하면 기본 이미지 영역을 보여준다.
 */
export function ClassThumbnail({ src, sizes, preload }: ClassThumbnailProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      // bg-muted 위 text-subtle은 대비가 4.5:1에 못 미쳐 surface-subtle을 쓴다
      <div
        className="grid size-full place-items-center bg-surface-subtle text-fg-subtle"
        aria-hidden="true"
        data-thumbnail="placeholder"
      >
        <ImageIcon size={28} />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt=""
      fill
      sizes={sizes}
      preload={preload}
      className="object-cover"
      onError={() => setFailedSrc(src)}
    />
  );
}
