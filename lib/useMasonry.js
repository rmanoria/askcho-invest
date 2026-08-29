"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export function useMasonry({ count, gap = 20, minColumnWidth = 300 }) {
    const containerRef = useRef(null);
    const itemRefs = useRef([]);
    const [layout, setLayout] = useState({ positions: [], height: 0 });

    itemRefs.current.length = count;

    const recalc = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        const width = container.offsetWidth;
        if (!width) return;

        const columns = Math.max(1, Math.floor((width + gap) / (minColumnWidth + gap)));
        const columnWidth = (width - gap * (columns - 1)) / columns;
        const columnHeights = new Array(columns).fill(0);
        const positions = [];

        itemRefs.current.forEach((el) => {
            if (!el) return;
            let col = 0;
            for (let i = 1; i < columns; i++) {
                if (columnHeights[i] < columnHeights[col]) col = i;
            }
            positions.push({ x: col * (columnWidth + gap), y: columnHeights[col], width: columnWidth });
            columnHeights[col] += el.offsetHeight + gap;
        });

        setLayout({
            positions,
            height: columnHeights.length ? Math.max(...columnHeights) - gap : 0,
        });
    }, [gap, minColumnWidth]);

    useEffect(() => {
        recalc();
        const ro = new ResizeObserver(() => recalc());
        if (containerRef.current) ro.observe(containerRef.current);
        itemRefs.current.forEach((el) => el && ro.observe(el));
        return () => ro.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [count, recalc]);

    return { containerRef, itemRefs, layout };
}