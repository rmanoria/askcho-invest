"use client";
import { useState } from "react";
import Link from "next/link";
import { History, LoaderCircle, Maximize2, Plus, Send, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useConversation } from "@/components/ConversationProvider";

export const TOPICS = [
    { label: "P/E ratio", prompt: "Explain how the price-to-earnings ratio is calculated, what high and low P/E values may indicate, how to compare P/E ratios across industries, and what limitations investors should keep in mind." },
    { label: "Diversification", prompt: "Explain how an investor can diversify across asset classes, sectors, companies, and regions, and how diversification can reduce concentration risk without guaranteeing against losses." },
    { label: "ETFs", prompt: "Explain how exchange-traded funds work, including their holdings, fees, liquidity, tracking error, and main risks, and describe what an investor should check before choosing one." },
    { label: "Dividends", prompt: "Explain how dividends work and how investors should assess dividend yield, payout ratio, cash-flow coverage, dividend growth, and the risk of a dividend cut." },
    { label: "Volatility", prompt: "Explain what causes stock-price volatility, how it can be measured, how it differs from a permanent loss of capital, and how long-term investors can manage it." },
    { label: "Market cap", prompt: "Explain market capitalization and compare the typical growth potential, liquidity, stability, and risks of large-cap, mid-cap, and small-cap companies." },
    { label: "NGX", prompt: "Give me an investor-focused overview of the Nigerian Exchange, including its major sectors, liquidity and currency considerations, key risks, useful valuation metrics, and how to research an NGX-listed company without making a specific buy or sell recommendation." },
    { label: "Risk", prompt: "Help me understand investment risk by covering market, company, liquidity, inflation, interest-rate, currency, concentration, and behavioral risks, and explain how time horizon and financial goals affect risk management." }
];

function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ConversationPanel({ compact = false, onClose }) {
    const [input, setInput] = useState("");
    const {
        conversations,
        conversationId,
        messages,
        historyLoading,
        messagesLoading,
        sending,
        chatError,
        logRef,
        isAuthenticated,
        selectConversation,
        startNewChat,
        send
    } = useConversation();

    function submit(text = input) {
        const question = text.trim();
        if (!question || sending) return;
        setInput("");
        send(question);
    }

    return (
        <div className={compact ? "iv-conversation-panel compact" : "iv-conversation-panel"}>
            {compact && (
                <div className="iv-floating-chat-head">
                    <img src="/askcho-logo.png" alt="AskCho" className="iv-floating-chat-logo" />
                    <div className="iv-floating-chat-head-text">
                        <div className="iv-floating-chat-title">AskCho</div>
                        <div className="iv-floating-chat-status"><span className="dot" /> {isAuthenticated ? "Your investing copilot" : "Ask anything about investing"}</div>
                    </div>
                    <button className="iv-icon-btn" onClick={onClose} aria-label="Close AskCho chat"><X size={17} /></button>
                </div>
            )}

            {!compact && (
                <div className="iv-panel-head iv-chat-heading">
                    <div><h3>Ask AI</h3><p className="iv-sub">{isAuthenticated ? "Your conversations are saved to your account." : "Ask questions about markets and investing."}</p></div>
                    <button className="iv-btn-ghost sm" onClick={startNewChat} disabled={sending}><Plus size={14} /> New chat</button>
                </div>
            )}

            {isAuthenticated && (
                <div className="iv-chat-history">
                    <div className="iv-chat-history-head"><span><History size={14} /> History</span>{historyLoading && <LoaderCircle size={14} className="iv-spin" />}</div>
                    {!historyLoading && !conversations.length && <p className="iv-empty-sm">No saved conversations yet.</p>}
                    {conversations.map((conversation) => (
                        <button key={conversation.id} className={"iv-chat-history-item " + (conversation.id === conversationId ? "active" : "")} onClick={() => selectConversation(conversation.id)} disabled={sending}>
                            <span>{conversation.title || "New conversation"}</span><small>{formatDate(conversation.updated_at)}</small>
                        </button>
                    ))}
                </div>
            )}

            <div className="iv-chat-log" ref={logRef}>
                {!messages.length && !messagesLoading && <div className="iv-chat-msg tutor">Ask me about the latest market news, stocks, or investing concepts.</div>}
                {messages.map((message, index) => <div key={index} className={"iv-chat-msg " + message.role}><ReactMarkdown>{message.text}</ReactMarkdown></div>)}
                {(messagesLoading || sending) && <div className="iv-chat-msg tutor iv-chat-typing"><span /><span /><span /></div>}
            </div>
            {chatError && <p className="iv-form-error">{chatError}</p>}
            {!messages.length && (<div className="iv-topic-chips iv-floating-chat-suggestions">
                {TOPICS.slice(0, compact ? 4 : TOPICS.length).map((topic) => <button key={topic.label} className="iv-chip" onClick={() => submit(topic.prompt)} disabled={sending}>{topic.label}</button>)}
            </div>)}
            <div className="iv-chat-input">
                <input aria-label="Ask AskCho" placeholder="Ask about markets, stocks, or investing..." value={input} disabled={sending} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submit()} />
                <button className="iv-btn-primary sm" onClick={() => submit()} disabled={sending || !input.trim()} aria-label="Send"><Send size={14} /></button>
            </div>
            {compact && <Link className="iv-floating-chat-footer" href="/ideas" onClick={onClose}><Maximize2 size={13} /> Open full chat and history</Link>}
        </div>
    );
}