import { Skeleton } from '@aninganing/react';
import { itemBodyClass, itemClass, itemThumbClass } from './ClassListItem';

/** 새로 열린 클래스 로딩 자리. 스크린 리더에는 숨기고 목록의 aria-busy로 알린다. */
export function ClassListItemSkeleton() {
  return (
    <div className={itemClass} aria-hidden="true">
      <div className={itemThumbClass}>
        <Skeleton shape="rect" width="100%" height="100%" />
      </div>
      <div className={`flex-1 ${itemBodyClass}`}>
        <Skeleton width="30%" />
        <Skeleton width="70%" />
        <Skeleton width="50%" />
      </div>
    </div>
  );
}
