"use client";

export default function SkeletonHero() {
    return (
        <div className="iv-home-hero skeleton-pulse" style={{ minHeight: 200 }}>
            <div className="iv-home-hero-image" style={{ height: 200, width: "100%", borderRadius: 8 }} />
            <div className="iv-home-hero-body" style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 20 }}>
                <div style={{ height: 14, width: "40%", marginBottom: 12, borderRadius: 4 }} />
                <div style={{ height: 28, width: "70%", marginBottom: 8, borderRadius: 4 }} />
                <div style={{ height: 12, width: "80%", borderRadius: 4 }} />
            </div>
        </div>
    );
}
