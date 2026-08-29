"use client";

export default function SkeletonCard() {
    return (
        <div className="iv-panel iv-watch-card skeleton-pulse">
            <div className="iv-panel-head">
                <div>
                    <div className="mono" style={{ height: 16, width: 60, marginBottom: 6, borderRadius: 4 }} />
                    <div className="iv-sub" style={{ height: 12, width: 100, borderRadius: 4 }} />
                </div>
                <div style={{ width: 24, height: 24, borderRadius: 4 }} />
            </div>
            <div style={{ height: 40, marginBottom: 12, borderRadius: 4 }} />
            <div className="iv-price-row">
                <div style={{ height: 16, width: 80, borderRadius: 4 }} />
                <div style={{ height: 16, width: 60, borderRadius: 4 }} />
            </div>
            <div style={{ height: 32, marginTop: 12, borderRadius: 4 }} />
        </div>
    );
}
