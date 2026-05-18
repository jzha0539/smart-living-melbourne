"use client";

// 放置路径: components/Chatbot.tsx

import React, { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function QuietCityAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [input, setInput] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [locationInfo, setLocationInfo] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const initialMsg = "Hi! I'm your Melbourne Space Assistant. I have access to live data on 80+ spaces across Melbourne — noise levels, temperatures, ratings, and more. Ask me anything!";

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: initialMsg },
  ]);

  const fabRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const locationFetched = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Get user location when chat opens (only once)
  // We insert the location message BEFORE any user interaction
  useEffect(() => {
    if (!isOpen || locationFetched.current) return;
    locationFetched.current = true;

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const suburb =
            data?.address?.suburb ||
            data?.address?.neighbourhood ||
            data?.address?.city_district ||
            data?.address?.town ||
            null;

          if (suburb) {
            setLocationInfo(suburb);
            // 把位置消息插入到初始欢迎消息之后（index 1），
            // 确保它排在用户提问之前
            setMessages((prev) => {
              const locationMsg: Message = {
                role: 'assistant',
                content: `📍 I can see you're near **${suburb}**. I can recommend spaces close to you — just ask!`,
              };
              // 如果已经有用户消息了，把位置消息插到第1条（欢迎语）后面
              const insertAt = 1;
              const next = [...prev];
              next.splice(insertAt, 0, locationMsg);
              return next;
            });
          }
        } catch {
          // 静默失败
        }
      },
      () => {},
      { timeout: 5000 }
    );
  }, [isOpen]);

  // FAB eye tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!fabRef.current) return;
      const rect = fabRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const dist = Math.min(4, Math.hypot(e.clientX - centerX, e.clientY - centerY) / 25);
      setMousePos({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isProcessing) return;
    setShowSuggestions(false);

    const userMessage: Message = { role: 'user', content: content.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsProcessing(true);

    try {
      // 过滤掉 assistant 的初始消息和位置消息，只发真实对话历史
      const historyToSend = updatedMessages.filter(
        (m) => !(m.role === 'assistant' && (
          m.content === initialMsg || m.content.startsWith('📍')
        ))
      );

      // 如果有位置信息，在对话最前面附加一条隐式上下文
      const messagesWithLocation = locationInfo
        ? [
            { role: 'user' as const, content: `(Context: user is currently near ${locationInfo}, Melbourne)` },
            { role: 'assistant' as const, content: 'Understood, I will prioritise spaces near that area.' },
            ...historyToSend,
          ]
        : historyToSend;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesWithLocation }),
      });

      const data = await response.json();

      if (data.success && data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: "The request is too frequent, please wait a few seconds and try again." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Connection error. Please check your network and try again." },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const suggestions = [
    "🤫 Quietest spot to study right now?",
    "☕ Best cafes for remote work?",
    "🌿 Most comfortable outdoor space today?",
    "⭐ Highest rated places nearby?",
  ];

  // 判断是否有真实的用户对话（排除位置消息）
  const hasUserMessages = messages.some((m) => m.role === 'user');

  return (
    <>
      {/* Floating Action Button */}
      <div style={fabWrapperStyle}>
        <button ref={fabRef} onClick={() => setIsOpen(!isOpen)} style={fabStyle}>
          <div style={outerBorderStyle} />
          <div style={innerBorderStyle} />
          <div style={robotFaceStyle}>
            <div style={{ ...eyeStyle, transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }} />
            <div style={{ ...eyeStyle, transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }} />
          </div>
        </button>
        <div style={fabLabelStyle}>AI Assistant</div>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div style={chatWindowStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>Melbourne Space AI</span>
              <span style={{ fontSize: '11px', opacity: 0.75 }}>
                {locationInfo ? `📍 Near ${locationInfo}` : 'Powered by live database'}
              </span>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button onClick={() => setShowMenu(!showMenu)} style={menuIconStyle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: showMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}>
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </button>
              {showMenu && (
                <div style={dropdownMenuStyle}>
                  <button style={menuItemStyle} onClick={() => { setIsOpen(false); setShowMenu(false); }}>
                    Minimize
                  </button>
                  <button style={{ ...menuItemStyle, borderBottom: 'none' }} onClick={() => {
                    setMessages([{ role: 'assistant', content: initialMsg }]);
                    setLocationInfo(null);
                    locationFetched.current = false;
                    setShowMenu(false);
                  }}>
                    Clear Chat
                  </button>
                </div>
              )}
            </div>
          </div>

            {/* Messages */}
            <div ref={scrollRef} style={chatBodyStyle}>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '12px',
                }}>
                  <div
                    style={{
                      ...messageBubbleStyle,
                      backgroundColor: msg.role === 'user' ? '#243C35' : '#f1f5f9',
                      color: msg.role === 'user' ? '#fff' : '#1e293b',
                      borderRadius: msg.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                    }}
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                  />
                </div>
              ))}

            {/* Typing indicator */}
            {isProcessing && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
                <div style={{ ...messageBubbleStyle, backgroundColor: '#f1f5f9', color: '#94a3b8' }}>
                  <TypingDots />
                </div>
              </div>
            )}
          </div>

          {/* Quick suggestions — 始终显示在输入框上方，不受对话影响 */}
          {!isProcessing && showSuggestions && (
            <div style={suggestionsAreaStyle}>
              <div style={suggestionRowStyle}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    style={{
                      ...suggestionChipStyle,
                      opacity: hasUserMessages ? 0.75 : 1,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Bar */}
          <div style={inputAreaStyle}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Ask about any Melbourne space..."
              style={inputStyle}
              disabled={isProcessing}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isProcessing || !input.trim()}
              style={{
                ...sendBtnStyle,
                opacity: isProcessing || !input.trim() ? 0.4 : 1,
                cursor: isProcessing || !input.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes orbit-1 {
          0% { transform: rotate(0deg) scale(1, 1.1); }
          50% { transform: rotate(180deg) scale(1.1, 1); }
          100% { transform: rotate(360deg) scale(1, 1.1); }
        }
        @keyframes orbit-2 {
          0% { transform: rotate(360deg) scale(1.1, 1); }
          50% { transform: rotate(180deg) scale(1, 1.1); }
          100% { transform: rotate(0deg) scale(1.1, 1); }
        }
        @keyframes blink {
          0%, 80%, 100% { opacity: 1; }
          40% { opacity: 0.2; }
        }
      `}</style>
    </>
  );
}

function formatMessage(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#94a3b8',
          animation: `blink 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

// --- Styles ---

const fabWrapperStyle: React.CSSProperties = {
  position: 'fixed', bottom: '120px', right: '30px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1000,
};

const fabStyle: React.CSSProperties = {
  width: '76px', height: '76px', backgroundColor: 'transparent',
  border: 'none', cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', position: 'relative',
};

const fabLabelStyle: React.CSSProperties = {
  marginTop: '4px', fontSize: '11px', fontWeight: 600, color: '#243C35',
};

const robotFaceStyle: React.CSSProperties = {
  position: 'relative', width: '60px', height: '60px', borderRadius: '50%',
  backgroundColor: '#fff', zIndex: 3, display: 'flex', alignItems: 'center',
  justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
};

const eyeStyle: React.CSSProperties = {
  width: '7px', height: '14px',
  background: 'linear-gradient(to bottom, #243C35, #4F6B57)',
  borderRadius: '4px', transition: 'transform 0.1s ease-out',
};

const outerBorderStyle: React.CSSProperties = {
  position: 'absolute', width: '100%', height: '110%', borderRadius: '42%',
  background: 'linear-gradient(45deg, #243C35, #4F6B57)',
  animation: 'orbit-1 5s linear infinite', zIndex: 1,
};

const innerBorderStyle: React.CSSProperties = {
  position: 'absolute', width: '110%', height: '100%', borderRadius: '45%',
  background: 'linear-gradient(-45deg, #4F6B57, #C9D8BF)',
  animation: 'orbit-2 4s linear infinite', zIndex: 2, opacity: 0.9,
};

const chatWindowStyle: React.CSSProperties = {
  position: 'fixed', bottom: '210px', right: '30px',
  width: '340px', height: '540px',
  backgroundColor: '#FFFDF8', borderRadius: '28px',
  boxShadow: '0 25px 60px rgba(36,60,53,0.18)', zIndex: 1000,
  overflow: 'hidden', display: 'flex', flexDirection: 'column',
  border: '1px solid #E4D9C8',
};

const headerStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #243C35, #4F6B57)',
  color: '#FFFDF8', padding: '14px 20px',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  flexShrink: 0,
};

const menuIconStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
  display: 'flex', alignItems: 'center', padding: '4px',
};

const dropdownMenuStyle: React.CSSProperties = {
  position: 'absolute', top: '35px', right: '0',
  backgroundColor: '#fff', borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
  overflow: 'hidden', width: '150px', zIndex: 1001, border: '1px solid #f1f5f9',
};

const menuItemStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', border: 'none', background: 'none',
  textAlign: 'center', fontSize: '13px', cursor: 'pointer',
  color: '#1e293b', borderBottom: '1px solid #f1f5f9', fontWeight: 500,
};

const chatBodyStyle: React.CSSProperties = {
  flex: 1, padding: '16px 16px 8px', overflowY: 'auto', backgroundColor: '#fcfcfc',
};

const messageBubbleStyle: React.CSSProperties = {
  maxWidth: '88%', padding: '10px 14px', fontSize: '13px', lineHeight: '1.55',
  whiteSpace: 'pre-wrap',
};

const suggestionsAreaStyle: React.CSSProperties = {
  padding: '8px 12px 4px',
  borderTop: '1px solid #f1f5f9',
  backgroundColor: '#fff',
  flexShrink: 0,
};

const suggestionRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
};

const suggestionChipStyle: React.CSSProperties = {
  padding: '6px 10px',
  backgroundColor: '#f1f5f9',
  border: '1px solid #e2e8f0',
  borderRadius: '20px',
  cursor: 'pointer',
  fontSize: '11px',
  color: '#334155',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  transition: 'background 0.15s',
};

const inputAreaStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  padding: '10px 14px 12px', backgroundColor: '#fff',
  flexShrink: 0,
};

const inputStyle: React.CSSProperties = {
  flex: 1, padding: '10px 14px', borderRadius: '20px',
  border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none',
  backgroundColor: '#f8fafc', color: '#1e293b',
};

const sendBtnStyle: React.CSSProperties = {
  width: '36px', height: '36px', borderRadius: '50%',
  backgroundColor: '#243C35', border: 'none', color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, transition: 'opacity 0.2s',
};
