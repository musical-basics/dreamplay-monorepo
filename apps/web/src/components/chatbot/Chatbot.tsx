"use client";

import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import { MessageCircle, Send, MinusCircle, Mail, ArrowRight } from 'lucide-react';

export default function Chatbot({ apiUrl = '/api/chat' }: { apiUrl?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [visible, setVisible] = useState(false);
    const [input, setInput] = useState('');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [emailSubmitted, setEmailSubmitted] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [askedSuggestions, setAskedSuggestions] = useState<Set<string>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const sessionCreatedRef = useRef(false);

    // ─── Email Gate State ───
    const [showEmailGate, setShowEmailGate] = useState(false);
    const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);

    const { messages, sendMessage, status } = useChat({
        transport: new TextStreamChatTransport({ api: apiUrl }),
    });

    const isLoading = status === 'submitted' || status === 'streaming';

    // Delay chatbot visibility by 20 seconds
    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 20000);
        return () => clearTimeout(timer);
    }, []);

    // Create a session on first open
    const createSession = useCallback(async () => {
        if (sessionCreatedRef.current) return;
        sessionCreatedRef.current = true;
        try {
            const res = await fetch('/api/chat-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ page_url: window.location.pathname }),
            });
            const data = await res.json();
            if (data.session_id) setSessionId(data.session_id);
        } catch (e) {
            console.error('Failed to create chat session:', e);
        }
    }, []);

    // Create session when chat opens
    useEffect(() => {
        if (isOpen && !sessionCreatedRef.current) {
            createSession();
        }
    }, [isOpen, createSession]);

    // Fetch suggested questions on mount
    useEffect(() => {
        fetch('/api/chat-suggestions')
            .then(r => r.json())
            .then(d => setSuggestions(d.suggestions || []))
            .catch(() => { });
    }, []);

    // 10-Second Auto-Popup Logic
    useEffect(() => {
        const hasPopped = sessionStorage.getItem('dp_chat_popped');
        if (!hasPopped) {
            const timer = setTimeout(() => {
                setIsOpen(true);
                sessionStorage.setItem('dp_chat_popped', 'true');
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, []);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, showEmailGate]);

    // Persist messages to the session
    const persistMessage = useCallback(async (role: string, content: string) => {
        if (!sessionId) return;
        try {
            await fetch('/api/chat-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, role, content }),
            });
        } catch (e) {
            console.error('Failed to persist message:', e);
        }
    }, [sessionId]);

    // Track messages and persist them
    const lastPersistedCountRef = useRef(0);
    useEffect(() => {
        if (!sessionId || messages.length === 0) return;
        const newMessages = messages.slice(lastPersistedCountRef.current);
        for (const msg of newMessages) {
            if (status === 'streaming' && msg.role === 'assistant') continue;
            const text = msg.parts
                .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                .map(p => p.text)
                .join('');
            if (text) {
                persistMessage(msg.role, text);
                lastPersistedCountRef.current++;
            }
        }
    }, [messages, status, sessionId, persistMessage]);

    // ─── Email Gate Handlers ───

    // When user clicks the text input (and hasn't submitted email yet)
    const handleInputFocus = () => {
        if (!emailSubmitted) {
            setShowEmailGate(true);
        }
    };

    // When user clicks a preset suggestion
    const handleSuggestionClick = (q: string) => {
        if (!emailSubmitted) {
            // Store the question, show email gate first
            setPendingQuestion(q);
            setShowEmailGate(true);
            return;
        }
        // Email already submitted — send normally
        setAskedSuggestions(prev => new Set(prev).add(q));
        sendMessage({ text: q });
    };

    // Submit email and then proceed
    const handleEmailSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        // Save email to session
        if (sessionId) {
            try {
                await fetch('/api/chat-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sessionId, email }),
                });
            } catch (e) {
                console.error('Failed to save email:', e);
            }
        }

        setEmailSubmitted(true);
        setShowEmailGate(false);

        // If there was a pending preset question, send it now
        if (pendingQuestion) {
            setAskedSuggestions(prev => new Set(prev).add(pendingQuestion!));
            sendMessage({ text: pendingQuestion });
            setPendingQuestion(null);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        if (!emailSubmitted) {
            setShowEmailGate(true);
            return;
        }
        sendMessage({ text: input });
        setInput('');
    };

    // Get the next 3 un-asked suggestions
    const remainingSuggestions = suggestions
        .filter(q => !askedSuggestions.has(q))
        .slice(0, 3);

    // Extract text content from a UIMessage's parts array
    const getMessageText = (parts: typeof messages[0]['parts']): string => {
        return parts
            .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
            .map((p) => p.text)
            .join('');
    };

    // Lightweight inline markdown renderer
    const renderMarkdown = (text: string): React.ReactNode => {
        const lines = text.split('\n');
        return lines.map((line, lineIdx) => {
            const bulletMatch = line.match(/^\s*[-*]\s+(.+)/);
            const isBullet = !!bulletMatch;
            const lineContent = (isBullet ? bulletMatch![1] : line) ?? "";

            const parts: React.ReactNode[] = [];
            const regex = /(\*\*(.+?)\*\*|__(.+?)__|_(.+?)_|\*(.+?)\*|`(.+?)`|\[([^\]]+)\]\(([^)]+)\))/g;
            let lastIndex = 0;
            let match;

            while ((match = regex.exec(lineContent)) !== null) {
                if (match.index > lastIndex) {
                    parts.push(lineContent.slice(lastIndex, match.index));
                }

                if (match[2]) {
                    parts.push(<strong key={`${lineIdx}-${match.index}`} className="font-semibold">{match[2]}</strong>);
                } else if (match[3]) {
                    parts.push(<u key={`${lineIdx}-${match.index}`}>{match[3]}</u>);
                } else if (match[4]) {
                    parts.push(<em key={`${lineIdx}-${match.index}`}>{match[4]}</em>);
                } else if (match[5]) {
                    parts.push(<em key={`${lineIdx}-${match.index}`}>{match[5]}</em>);
                } else if (match[6]) {
                    parts.push(<code key={`${lineIdx}-${match.index}`} className="bg-white/10 px-1 py-0.5 rounded text-[13px]">{match[6]}</code>);
                } else if (match[7] && match[8]) {
                    parts.push(
                        <a key={`${lineIdx}-${match.index}`} href={match[8]} target="_blank" rel="noopener noreferrer" className="underline text-[#4a9eff] hover:text-[#6bb3ff]">
                            {match[7]}
                        </a>
                    );
                }

                lastIndex = match.index + match[0].length;
            }

            if (lastIndex < lineContent.length) {
                parts.push(lineContent.slice(lastIndex));
            }

            return (
                <span key={lineIdx}>
                    {lineIdx > 0 && <br />}
                    {isBullet && <span className="mr-1">•</span>}
                    {parts.length > 0 ? parts : lineContent}
                </span>
            );
        });
    };

    return (
        <div className={`fixed bottom-6 right-6 z-[9999] flex flex-col items-end transition-opacity duration-700 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-[#050505] border border-white/20 shadow-2xl rounded-2xl w-80 sm:w-96 h-[500px] mb-4 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300">

                    {/* Header */}
                    <div className="bg-white/5 border-b border-white/10 px-4 py-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-white font-serif font-medium">DreamPlay Support</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors cursor-pointer">
                            <MinusCircle size={18} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && !showEmailGate && (
                            <div className="mt-4 space-y-4">
                                <p className="text-white/50 text-sm text-center font-sans leading-relaxed">
                                    👋 Hi! Any questions about hand sizes, pricing, or shipping?
                                </p>
                                {remainingSuggestions.length > 0 && (
                                    <div className="space-y-2 px-2">
                                        {remainingSuggestions.map((q, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSuggestionClick(q)}
                                                className="w-full text-left px-3 py-2 text-sm text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Email Gate Screen */}
                        {showEmailGate && !emailSubmitted && (
                            <div className="flex flex-col items-center justify-center py-8 px-2 space-y-5 animate-in fade-in duration-300">
                                <div className="w-14 h-14 rounded-full bg-[#4a9eff]/10 flex items-center justify-center">
                                    <Mail className="w-7 h-7 text-[#4a9eff]" />
                                </div>
                                <div className="space-y-2 text-center">
                                    <p className="text-white/90 text-sm font-medium leading-relaxed">
                                        Leave your email so we can send you the most important information about our revolutionary narrow-key digital piano.
                                    </p>
                                </div>
                                {pendingQuestion && (
                                    <div className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                                        <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Your question</p>
                                        <p className="text-white/70 text-xs leading-relaxed">{pendingQuestion}</p>
                                    </div>
                                )}
                                <form onSubmit={handleEmailSubmit} className="w-full space-y-2">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        autoFocus
                                        className="w-full bg-transparent border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#4a9eff] transition-colors placeholder:text-white/30"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!email.trim()}
                                        className="w-full flex items-center justify-center gap-2 bg-[#4a9eff] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#4a9eff]/80 disabled:opacity-40 transition-colors cursor-pointer"
                                    >
                                        Continue
                                        <ArrowRight size={14} />
                                    </button>
                                </form>
                                <button
                                    onClick={() => { setShowEmailGate(false); setPendingQuestion(null); }}
                                    className="text-white/30 text-xs hover:text-white/50 transition-colors cursor-pointer"
                                >
                                    Go back
                                </button>
                            </div>
                        )}

                        {messages.map((m) => (
                            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm font-sans leading-relaxed ${m.role === 'user' ? 'bg-[#4a9eff] text-white rounded-tr-sm' : 'bg-white/10 text-white/90 rounded-tl-sm'
                                    }`}>
                                    {renderMarkdown(getMessageText(m.parts))}
                                </div>
                            </div>
                        ))}
                        {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
                            <div className="flex justify-start">
                                <div className="px-4 py-2.5 rounded-2xl bg-white/10 text-white/50 text-sm rounded-tl-sm animate-pulse">
                                    Typing...
                                </div>
                            </div>
                        )}

                        {/* Suggested questions after assistant response */}
                        {!isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && remainingSuggestions.length > 0 && (
                            <div className="space-y-2 px-1 pt-1">
                                {remainingSuggestions.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSuggestionClick(q)}
                                        className="w-full text-left px-3 py-2 text-sm text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="p-3 bg-white/5 border-t border-white/10 flex gap-2">
                        <input
                            className="flex-1 bg-transparent border border-white/20 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-[#4a9eff] transition-colors"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onFocus={handleInputFocus}
                            placeholder="Ask a question..."
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="bg-white text-black p-2 rounded-full hover:bg-white/90 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}

            {/* Floating Toggle Button */}
            {!isOpen && (
                <div className="flex flex-col items-end gap-2">
                    {/* Floating prompt label */}
                    <div className="relative bg-white text-black text-xs font-medium px-3 py-2 rounded-lg shadow-lg animate-[fadeInUp_0.5s_ease-out] whitespace-nowrap">
                        Have a question? Ask us anything!
                        {/* Small triangle pointer */}
                        <div className="absolute -bottom-1.5 right-5 w-3 h-3 bg-white rotate-45 shadow-lg" />
                    </div>
                    <button
                        onClick={() => { setIsOpen(true); sessionStorage.setItem('dp_chat_popped', 'true'); }}
                        className="bg-white text-black p-4 rounded-full shadow-xl hover:bg-white/90 transition-transform hover:scale-105 cursor-pointer"
                    >
                        <MessageCircle size={24} />
                    </button>
                </div>
            )}
        </div>
    );
}
