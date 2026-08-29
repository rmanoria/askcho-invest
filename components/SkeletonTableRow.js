"use client";

export default function SkeletonTableRow({ colCount = 4 }) {
    return (
        <tr className="skeleton-pulse">
            {Array.from({ length: colCount }).map((_, i) => (
                <td key={i} style={{ padding: "12px 8px" }}>
                    <div style={{ height: 16, width: i === 0 ? "70%" : "60%", borderRadius: 4 }} />
                </td>
            ))}
        </tr>
    );
}
