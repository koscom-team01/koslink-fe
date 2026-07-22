import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

/**
 * 목록 하단에 붙이는 sentinel용 훅. 반환된 ref를 목록 끝에 렌더하면, 스크롤
 * 컨테이너 안에서 보이는 순간 다음 페이지를 불러온다. NewsList/VerifyList가 공유한다.
 *
 * `root`를 명시하지 않으면(기본값 null) 브라우저 최상위 뷰포트 기준으로 교차를
 * 판정하는데, 목록 패널이 페이지 아래쪽에 있으면 내부 스크롤을 끝까지 내려도
 * sentinel의 실제 좌표가 뷰포트 밖에 남아 절대 트리거되지 않는다. 그래서
 * 실제로 스크롤되는 컨테이너의 ref를 root로 명시해야 한다.
 */
export function useInfiniteScrollTrigger(
  hasNextPage: boolean,
  isFetchingNextPage: boolean,
  fetchNextPage: () => void,
  scrollRootRef: RefObject<HTMLElement | null>,
) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasNextPage) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage()
      },
      { root: scrollRootRef.current, rootMargin: '120px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, scrollRootRef])

  return sentinelRef
}
