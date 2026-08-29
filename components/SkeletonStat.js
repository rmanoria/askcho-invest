"use client";

export default function SkeletonStat() {
    return (
        <div className="iv-stat skeleton-pulse">
            <div className="iv-stat-label" style={{ height: 12, width: "60%", borderRadius: 4, marginBottom: 8 }} />
            <div className="iv-stat-value mono" style={{ height: 24, width: "80%", borderRadius: 4, marginBottom: 6 }} />
            <div className="iv-chg" style={{ height: 16, width: "50%", borderRadius: 4 }} />
        </div>
    );
}
