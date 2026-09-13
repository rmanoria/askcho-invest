"use client";
import { useEffect, useState } from "react";
import { ExternalLink, Lightbulb } from "lucide-react";
import { fetchNewsDigest } from "@/lib/api";
import PageFrame from "@/components/PageFrame";
import ConversationPanel from "@/components/ConversationPanel";

export default function IdeasPage() {
    const [digest, setDigest] = useState(null);
    const [digestLoading, setDigestLoading] = useState(true);
    const [digestError, setDigestError] = useState("");

    useEffect(() => {
        let cancelled = false;
        setDigestLoading(true);
        fetchNewsDigest()
            .then((data) => { if (!cancelled) setDigest(data); })
            .catch(() => { if (!cancelled) setDigestError("Unable to load the AI news digest."); })
            .finally(() => { if (!cancelled) setDigestLoading(false); });
        return () => { cancelled = true; };
    }, []);

    return (
        <PageFrame title="Ideas">
            <div className="iv-panel">
                <div className="iv-panel-head"><h3>AI market digest</h3><Lightbulb size={16} className="muted" /></div>
                {digestLoading ? <p className="iv-empty-sm">Preparing today&apos;s digest...</p> : digestError ? <p className="iv-empty-sm">{digestError}</p> : digest ? (
                    <>
                        <p className="iv-sub iv-digest-overview">{digest.overview}</p>
                        <div className="iv-summary-list">
                            {(digest.highlights || []).map((highlight) => (
                                <div key={highlight.headline} className="iv-summary-item">
                                    <div className="iv-panel-head" style={{ marginBottom: 6 }}>
                                        <div className={`iv-eyebrow iv-sentiment-${highlight.sentiment}`}>{highlight.sentiment}</div>
                                        {highlight.published_at && <span className="iv-sub">{formatDate(highlight.published_at)}</span>}
                                    </div>
                                    <p className="iv-sub" style={{ marginBottom: 5 }}><strong>{highlight.headline}</strong></p>
                                    <p className="iv-sub" style={{ marginBottom: highlight.url ? 7 : 0 }}>{highlight.why_it_matters}</p>
                                    {highlight.url && <a className="iv-inline-link" href={highlight.url} target="_blank" rel="noreferrer">Read source <ExternalLink size={12} /></a>}
                                </div>
                            ))}
                            {!digest.highlights?.length && <p className="iv-empty-sm">No major market-moving stories were found in the latest news.</p>}
                        </div>
                    </>
                ) : null}
            </div>

            <ConversationPanel />
        </PageFrame>
    );
}
