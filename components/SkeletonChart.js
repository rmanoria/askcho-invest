"use client";

export default function SkeletonChart({ height = 200 }) {
    return (
        <div className="skeleton-pulse" style={{ height, width: "100%", borderRadius: 8, marginBottom: 12 }}>
            <svg style={{ width: "100%", height: "100%", opacity: 0.3 }}>
                <polyline
                    points={`0,${height * 0.6} 10,${height * 0.4} 20,${height * 0.7} 30,${height * 0.5} 40,${height * 0.6}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                />
            </svg>
        </div>
    );
}
