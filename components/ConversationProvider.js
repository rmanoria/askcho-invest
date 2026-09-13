"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import {
    createConversation,
    fetchConversation,
    fetchConversations,
    sendConversationMessage,
    sendPublicConversationMessage
} from "@/lib/api";

const ConversationContext = createContext(null);

function normalizeMessage(message) {
    return {
        role: message.role === "bot" ? "tutor" : "user",
        text: message.message
    };
}

export function ConversationProvider({ children }) {
    const { state } = useStore();
    const sessionToken = state.session?.access_token;
    const [conversations, setConversations] = useState([]);
    const [conversationId, setConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [chatError, setChatError] = useState("");
    const [publicConversationId, setPublicConversationId] = useState(null);
    const logRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        setMessages([]);
        setConversationId(null);
        setPublicConversationId(null);
        setChatError("");
        if (!sessionToken) {
            setConversations([]);
            setHistoryLoading(false);
            return () => { cancelled = true; };
        }

        setHistoryLoading(true);
        fetchConversations(sessionToken)
            .then((items) => {
                if (!cancelled) setConversations(Array.isArray(items) ? items : []);
            })
            .catch((error) => {
                if (!cancelled) setChatError(error.message || "Unable to load chat history.");
            })
            .finally(() => {
                if (!cancelled) setHistoryLoading(false);
            });

        return () => { cancelled = true; };
    }, [sessionToken]);

    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [messages, sending, messagesLoading]);

    async function selectConversation(id) {
        if (!sessionToken || id === conversationId || sending) return;
        setConversationId(id);
        setMessagesLoading(true);
        setChatError("");
        try {
            const conversation = await fetchConversation(id, sessionToken);
            setMessages((conversation.messages || []).map(normalizeMessage));
        } catch (error) {
            setChatError(error.message || "Unable to load this conversation.");
        } finally {
            setMessagesLoading(false);
        }
    }

    function startNewChat() {
        if (sending) return;
        setConversationId(null);
        setPublicConversationId(null);
        setMessages([]);
        setChatError("");
    }

    async function send(text) {
        const question = text?.trim();
        if (!question || sending) return;
        setChatError("");
        setMessages((current) => [...current, { role: "user", text: question }]);
        setSending(true);
        try {
            if (sessionToken) {
                let activeId = conversationId;
                if (!activeId) {
                    const conversation = await createConversation(sessionToken);
                    activeId = conversation.id;
                    setConversationId(activeId);
                    setConversations((current) => [conversation, ...current]);
                }
                const response = await sendConversationMessage(activeId, question, sessionToken);
                setMessages((current) => [...current, normalizeMessage(response)]);
                const updated = await fetchConversations(sessionToken);
                setConversations(Array.isArray(updated) ? updated : []);
            } else {
                const response = await sendPublicConversationMessage(question, publicConversationId);
                setPublicConversationId(response.interaction_id || null);
                setMessages((current) => [...current, { role: "tutor", text: response.message }]);
            }
        } catch (error) {
            setChatError(error.message || "Unable to send your message.");
        } finally {
            setSending(false);
        }
    }

    const value = useMemo(() => ({
        conversations,
        conversationId,
        messages,
        historyLoading,
        messagesLoading,
        sending,
        chatError,
        logRef,
        isAuthenticated: Boolean(sessionToken),
        selectConversation,
        startNewChat,
        send
    }), [conversations, conversationId, messages, historyLoading, messagesLoading, sending, chatError, sessionToken]);

    return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
}

export function useConversation() {
    const context = useContext(ConversationContext);
    if (!context) throw new Error("useConversation must be used within ConversationProvider");
    return context;
}