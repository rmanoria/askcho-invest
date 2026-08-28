"use client";
import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";

// Opens a news article in-app via iframe. Note: some publishers (many news sites,
// including several used by this feed \u2014 Google News redirect links in particular)
// send headers that block being framed by another site \u2014 that's a security setting
// on their end we can't override, so the "open in new tab" action is always
// available as a fallback for those cases.
export default function ArticleViewerModal({ article, onClose }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!article || !mounted) return null;

  return createPortal(
    <div className="iv-modal-overlay iv-article-overlay" onClick={onClose}>
      <div className="iv-article-modal" onClick={(e) => e.stopPropagation()}>
        <div className="iv-article-modal-head">
          <div className="iv-article-modal-title">
            <span className="iv-sub">{article.source}</span>
            <h3>{article.headline}</h3>
          </div>
          <div className="iv-article-modal-actions">
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="iv-icon-btn" aria-label="Open in new tab" title="Open in new tab">
              <ExternalLink size={15} />
            </a>
            <button className="iv-icon-btn" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="iv-article-modal-body">
          <iframe src={article.url} title={article.headline} className="iv-article-modal-iframe" />
        </div>
        <div className="iv-article-modal-foot">
          Article not loading? <a href={article.url} target="_blank" rel="noopener noreferrer">Open it directly <ExternalLink size={11} /></a>
        </div>
      </div>
    </div>,
    document.body
  );
}