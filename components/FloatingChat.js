"use client";
import { useState } from "react";
import ConversationPanel from "@/components/ConversationPanel";

export default function FloatingChat() {
    const [open, setOpen] = useState(false);

    return (
        <aside className={"iv-floating-chat" + (open ? " open" : "")} aria-label="AskCho assistant">
            {open && <div className="iv-floating-chat-panel"><ConversationPanel compact onClose={() => setOpen(false)} /></div>}
            {!open && <div className="iv-floating-chat-btn-wrap"><button className="iv-floating-chat-btn" onClick={() => setOpen(true)} aria-label="Open AskCho chat"><img src="/askcho-logo.png" alt="" className="iv-floating-chat-btn-logo" /></button><span className="iv-floating-chat-ping" aria-hidden="true" /></div>}
        </aside>
    );
}