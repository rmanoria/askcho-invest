"use client";
import { Users } from "lucide-react";
import PageFrame from "@/components/PageFrame";

export default function CommunityPage() {
  return (
    <>
      <PageFrame title="Community">
        <div className="iv-panel">
          <div className="iv-panel-head">
            <div>
              <div className="iv-eyebrow">TOP INVESTORS</div>
              <h3>See what other investors are holding</h3>
            </div>
            <Users size={16} className="muted" />
          </div>
          <p className="iv-empty-sm">Community portfolios are not available yet.</p>
        </div>
      </PageFrame>
    </>
  );
}
