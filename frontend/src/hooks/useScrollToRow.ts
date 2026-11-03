"use client";

import { useEffect, useRef } from "react";

/**
 * For tables in their own scroll box: whenever `target` or `page` changes, scroll the
 * box (not the page) so the target row sits just under the sticky header, or to the
 * top when there is no target.
 */
export function useScrollToRow(target: number | null, page: string) {
  const scroller = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    const box = scroller.current;
    if (!box) return;
    const header = box.querySelector("thead")?.getBoundingClientRect().height ?? 0;
    box.scrollTop = row.current ? row.current.offsetTop - header : 0;
  }, [target, page]);

  return { scroller, row };
}
