"use client";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, History, Lightbulb, LoaderCircle, Plus, Send } from "lucide-react";
import { useStore } from "@/lib/store";
import { fetchConversation, fetchConversations, fetchNewsDigest, createConversation, sendConversationMessage } from "@/lib/api";
import PageFrame from "@/components/PageFrame";
import ReactMarkdown from "react-markdown";

const TOPICS = [
    {
        label: "P/E ratio",
        prompt: "Explain how the price-to-earnings ratio is calculated, what high and low P/E values may indicate, how to compare P/E ratios across industries, and what limitations investors should keep in mind."
    },
    {
        label: "Diversification",
        prompt: "Explain how an investor can diversify across asset classes, sectors, companies, and regions, and how diversification can reduce concentration risk without guaranteeing against losses."
    },
    {
        label: "ETFs",
        prompt: "Explain how exchange-traded funds work, including their holdings, fees, liquidity, tracking error, and main risks, and describe what an investor should check before choosing one."
    },
    {
        label: "Dividends",
        prompt: "Explain how dividends work and how investors should assess dividend yield, payout ratio, cash-flow coverage, dividend growth, and the risk of a dividend cut."
    },
    {
        label: "Volatility",
        prompt: "Explain what causes stock-price volatility, how it can be measured, how it differs from a permanent loss of capital, and how long-term investors can manage it."
    },
    {
        label: "Market cap",
        prompt: "Explain market capitalization and compare the typical growth potential, liquidity, stability, and risks of large-cap, mid-cap, and small-cap companies."
    },
    {
        label: "NGX",
        prompt: "Give me an investor-focused overview of the Nigerian Exchange, including its major sectors, liquidity and currency considerations, key risks, useful valuation metrics, and how to research an NGX-listed company without making a specific buy or sell recommendation."
    },
    {
        label: "Risk",
        prompt: "Help me understand investment risk by covering market, company, liquidity, inflation, interest-rate, currency, concentration, and behavioral risks, and explain how time horizon and financial goals affect risk management."
    }
];

function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function IdeasPage() {
    const { state } = useStore();
    const sessionToken = state.session?.access_token;
    const [digest, setDigest] = useState(null);
    const [digestLoading, setDigestLoading] = useState(true);
    const [digestError, setDigestError] = useState("");
    const [conversations, setConversations] = useState([]);
    const [conversationId, setConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [chatError, setChatError] = useState("");
    const logRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        setDigestLoading(true);
        fetchNewsDigest()
            .then((data) => { if (!cancelled) setDigest(data); })
            .catch(() => { if (!cancelled) setDigestError("Unable to load the AI news digest."); })
            .finally(() => { if (!cancelled) setDigestLoading(false); });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!sessionToken) {
            setConversations([]);
            setConversationId(null);
            setMessages([]);
            setHistoryLoading(false);
            return undefined;
        }
        let cancelled = false;
        setHistoryLoading(true);
        fetchConversations(sessionToken)
            .then((items) => {
                if (cancelled) return;
                setConversations(Array.isArray(items) ? items : []);
            })
            .catch(() => { if (!cancelled) setChatError("Unable to load chat history."); })
            .finally(() => { if (!cancelled) setHistoryLoading(false); });
        return () => { cancelled = true; };
    }, [sessionToken]);

    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [messages, sending]);

    async function selectConversation(id) {
        if (!sessionToken || id === conversationId || sending) return;
        setConversationId(id);
        setMessagesLoading(true);
        setChatError("");
        try {
            const conversation = await fetchConversation(id, sessionToken);
            setMessages((conversation.messages || []).map((message) => ({
                role: message.role === "bot" ? "tutor" : "user",
                text: message.message
            })));
        } catch (error) {
            setChatError(error.message || "Unable to load this conversation.");
        } finally {
            setMessagesLoading(false);
        }
    }

    function startNewChat() {
        if (sending) return;
        setConversationId(null);
        setMessages([]);
        setInput("");
        setChatError("");
    }

    async function send(text) {
        const question = (text || input).trim();
        if (!question || sending || !sessionToken) return;
        setInput("");
        setChatError("");
        setMessages((current) => [...current, { role: "user", text: question }]);
        setSending(true);
        try {
            let activeId = conversationId;
            if (!activeId) {
                const conversation = await createConversation(sessionToken);
                activeId = conversation.id;
                setConversationId(activeId);
                setConversations((current) => [conversation, ...current]);
            }
            const response = await sendConversationMessage(activeId, question, sessionToken);
            setMessages((current) => [...current, { role: "tutor", text: response.message }]);
            const updated = await fetchConversations(sessionToken);
            setConversations(Array.isArray(updated) ? updated : []);
        } catch (error) {
            setChatError(error.message || "Unable to send your message.");
        } finally {
            setSending(false);
        }
    }

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

            <div className="iv-panel iv-learn-panel">
                <div className="iv-panel-head iv-chat-heading">
                    <div><h3>Ask AI</h3><p className="iv-sub">Your conversations are saved to your account.</p></div>
                    <button className="iv-btn-ghost sm" onClick={startNewChat} disabled={sending}><Plus size={14} /> New chat</button>
                </div>
                <div className="iv-chat-history">
                    <div className="iv-chat-history-head"><span><History size={14} /> History</span>{historyLoading && <LoaderCircle size={14} className="iv-spin" />}</div>
                    {!historyLoading && !conversations.length && <p className="iv-empty-sm">No saved conversations yet.</p>}
                    {conversations.map((conversation) => (
                        <button key={conversation.id} className={"iv-chat-history-item " + (conversation.id === conversationId ? "active" : "")} onClick={() => selectConversation(conversation.id)} disabled={sending}>
                            <span>{conversation.title || "New conversation"}</span><small>{formatDate(conversation.updated_at)}</small>
                        </button>
                    ))}
                </div>
                <div className="iv-chat-log" ref={logRef}>
                    {!messages.length && !messagesLoading && <div className="iv-chat-msg tutor">Ask me about the latest market news, stocks, or investing concepts.</div>}
                    {messages.map((message, index) => <div key={index} className={"iv-chat-msg " + message.role}>
                        <ReactMarkdown>{message.text}</ReactMarkdown>
                    </div>)}
                    {messagesLoading && <div className="iv-chat-msg tutor iv-chat-typing"><span /><span /><span /></div>}
                    {sending && <div className="iv-chat-msg tutor iv-chat-typing"><span /><span /><span /></div>}
                </div>
                {chatError && <p className="iv-form-error">{chatError}</p>}
                <div className="iv-topic-chips">
                    {TOPICS.map((topic) => <button key={topic.label} className="iv-chip" onClick={() => send(topic.prompt)} disabled={sending}>{topic.label}</button>)}
                </div>
                <div className="iv-chat-input">
                    <input placeholder="Ask about markets, stocks, or investing..." value={input} disabled={sending} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} />
                    <button className="iv-btn-primary sm" onClick={() => send()} disabled={sending || !input.trim()} aria-label="Send"><Send size={14} /></button>
                </div>
            </div>
        </PageFrame>
    );
}
