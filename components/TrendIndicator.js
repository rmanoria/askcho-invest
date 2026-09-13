"use client";
import { ChevronDown, ChevronUp, Minus } from "lucide-react";

export default function TrendIndicator({ changePct }) {
    const value = Number(changePct);
    const isNeutral = !Number.isFinite(value) || value === 0;
    const className = "iv-trend-indicator " + (isNeutral ? "neutral" : value > 0 ? "pos" : "neg");
    const label = isNeutral ? "Neutral trend" : value > 0 ? "Rising trend" : "Falling trend";
    const Icon = isNeutral ? Minus : value > 0 ? ChevronUp : ChevronDown;

    return (
        <span className={className} title={label} aria-label={label}>
            <Icon size={16} strokeWidth={2.2} />
        </span>
    );
}
