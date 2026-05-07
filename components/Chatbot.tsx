"use client";

import React, { useState, useEffect, useRef } from 'react';

// --- Type Definitions / 类型定义 ---
interface Space {
  name: string;
  noiseDb: number;
  comfort: number;
  distance: number;
  shade: number;
  category: string;
  quietTime: string;
}

interface Message {
  role: 'user' | 'bot';
  content: string;
}

// --- Predefined Knowledge / 预设知识库 ---
const MELBOURNE_KNOWLEDGE: Record<string, { q: string, a: string }> = {
  cafe: { 
    q: "Work-friendly cafes?", 
    a: "Based on current urban data, **Acre Secondary** or the **State Library Cafe** are great options." 
  },
  study: { 
    q: "Recommended quiet zones", 
    a: "For deep focus, I recommend the **Docklands Library** or the **Royal Botanic Gardens**." 
  },
  uv: { 
    q: "Current UV alert status", 
    a: "The current UV Index in Melbourne is **Moderate (3)**." 
  }
};

export default function QuietCityAssistant() {
  // --- State Management / 状态管理 ---
  const [isOpen, setIsOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compareSpaces, setCompareSpaces] = useState<Space[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // --- Initial Message / 消息初始化 ---
  const initialBotMsg = "Ready to help! Select a topic or add spaces to Compare for a personalized analysis.";
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: initialBotMsg }
  ]);
  
  const fabRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- Auto-scroll Logic / 自动滚动到底部 ---
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  // --- Sync Context from Storage / 同步本地存储数据 ---
  useEffect(() => {
    const updateContext = () => {
      const stored = localStorage.getItem('compare-spaces');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCompareSpaces(Array.isArray(parsed) ? parsed : []);
        } catch (e) { 
          console.error(e); 
        }
      }
    };
    updateContext();
    window.addEventListener('storage', updateContext);
    return () => window.removeEventListener('storage', updateContext);
  }, []);

  // --- FAB Eye Movement Logic / 悬浮球眼神追踪逻辑 ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!fabRef.current) return;
      const rect = fabRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const dist = Math.min(
        4, 
        Math.hypot(e.clientX - centerX, e.clientY - centerY) / 25
      );
      
      setMousePos({ 
        x: Math.cos(angle) * dist, 
        y: Math.sin(angle) * dist 
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // --- Interaction Logic / 动作处理逻辑 ---
  const handleAction = (type: string) => {
    if (isProcessing) return;

    let userContent = "";
    let botContent = "";

    if (MELBOURNE_KNOWLEDGE[type]) {
      userContent = MELBOURNE_KNOWLEDGE[type].q;
      botContent = MELBOURNE_KNOWLEDGE[type].a;
    } else {
      if (compareSpaces.length === 0) {
        userContent = "Compare Insight";
        botContent = "👋 Add locations to your 'Compare' list to enable noise and distance insights.";
      } else {
        const s1 = compareSpaces[0];
        const s2 = compareSpaces[1] || null;

        if (type === 'quiet') {
          userContent = "Which is quietest?";
          botContent = s2 
            ? `🤫 Result: **${s1.noiseDb < s2.noiseDb ? s1.name : s2.name}** is quieter (${Math.min(s1.noiseDb, s2.noiseDb)}dB).`
            : `🤫 **${s1.name}** is currently at ${s1.noiseDb}dB.`;
        } else if (type === 'distance') {
          userContent = "Walk Duration";
          botContent = `🚶 It is roughly a **${Math.round(s1.distance * 12)} minute** walk to **${s1.name}**.`;
        } else {
          userContent = "Full Report";
          botContent = `🤖 Detailed Analysis: **${s1.name}** comfort is ${s1.comfort}/100. Quietest around **${s1.quietTime}**.`;
        }
      }
    }

    setMessages(prev => [...prev, { role: 'user', content: userContent }]);
    setIsProcessing(true);

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', content: botContent }]);
      setIsProcessing(false);
    }, 800);
  };

  return (
    <>
      {/* Floating Action Button (FAB) / 悬浮按钮 */}
      <div style={fabWrapperStyle}>
        <button ref={fabRef} onClick={() => setIsOpen(!isOpen)} style={fabStyle}>
          <div style={outerBorderStyle}></div>
          <div style={innerBorderStyle}></div>
          <div style={robotFaceStyle}>
            <div style={{
              ...eyeStyle, 
              transform: `translate(${mousePos.x}px, ${mousePos.y}px)`
            }}></div>
            <div style={{
              ...eyeStyle, 
              transform: `translate(${mousePos.x}px, ${mousePos.y}px)`
            }}></div>
          </div>
        </button>
        <div style={fabLabelStyle}>Chatbot</div>
      </div>

      {/* Chat Window / 聊天窗口 */}
      {isOpen && (
        <div style={chatWindowStyle}>
          {/* Header Section / 头部区域 */}
          <div style={headerStyle}>
            <span style={{ fontSize: '15px', fontWeight: 600 }}>Chatbot</span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button onClick={() => setShowMenu(!showMenu)} style={menuIconStyle}>
                <svg 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  style={{ 
                    transform: showMenu ? 'rotate(180deg)' : 'rotate(0deg)', 
                    transition: '0.2s' 
                  }}
                >
                  <path d="M18 15l-6-6-6 6"/>
                </svg>
              </button>
              
              {/* Dropdown Menu / 下拉菜单 */}
              {showMenu && (
                <div style={dropdownMenuStyle}>
                  <button 
                    style={menuItemStyle} 
                    onClick={() => { setIsOpen(false); setShowMenu(false); }}
                  >
                    Minimize Window
                  </button>
                  <button 
                    style={{...menuItemStyle, borderBottom: 'none'}} 
                    onClick={() => { 
                      setMessages([{ role: 'bot', content: initialBotMsg }]); 
                      setShowMenu(false); 
                    }}
                  >
                    Clear Conversation
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Messages Body / 消息主体 */}
          <div ref={scrollRef} style={chatBodyStyle}>
            {messages.map((msg, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '15px' 
              }}>
                <div style={{
                  ...messageBubbleStyle,
                  backgroundColor: msg.role === 'user' ? '#6e45e2' : '#f1f5f9',
                  color: msg.role === 'user' ? '#fff' : '#1e293b',
                  borderRadius: msg.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                }} dangerouslySetInnerHTML={{ __html: msg.content }} />
              </div>
            ))}

            {/* Processing Indicator / 处理状态指示器 */}
            {isProcessing && (
              <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'flex-start' }}>
                <div className="animate-pulse" style={{ 
                  ...messageBubbleStyle, 
                  backgroundColor: '#f1f5f9', 
                  color: '#94a3b8' 
                }}>
                  Analyzing data...
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions / 底部操作按钮 */}
          <div style={footerActionStyle}>
            <div style={sectionTitleStyle}>✨ COMPARE INSIGHTS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
              <button onClick={() => handleAction('quiet')} style={smallBtnStyle}>Quietest?</button>
              <button onClick={() => handleAction('distance')} style={smallBtnStyle}>Walk Duration</button>
              <button onClick={() => handleAction('summary')} style={smallBtnStyle}>Full Report</button>
            </div>
            
            <div style={sectionTitleStyle}>📍 MELBOURNE ASSISTANT</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button onClick={() => handleAction('cafe')} style={smallBtnStyle}>☕ Work-friendly cafes?</button>
              <button onClick={() => handleAction('study')} style={smallBtnStyle}>📖 Recommended quiet zones</button>
              <button onClick={() => handleAction('uv')} style={smallBtnStyle}>☀️ Current UV alert status</button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS Animations / 全局动画 */}
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
        .animate-pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 50% { opacity: .5; } }
      `}</style>
    </>
  );
}

// --- Style Definitions / 样式定义 ---
const fabWrapperStyle: React.CSSProperties = { 
  position: 'fixed', 
  bottom: '120px', 
  right: '30px', 
  display: 'flex', 
  flexDirection: 'column', 
  alignItems: 'center', 
  zIndex: 1000 
};

const fabStyle: React.CSSProperties = { 
  width: '76px', 
  height: '76px', 
  backgroundColor: 'transparent', 
  border: 'none', 
  cursor: 'pointer', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  position: 'relative' 
};

const fabLabelStyle: React.CSSProperties = { 
  marginTop: '4px', 
  fontSize: '12px', 
  fontWeight: 600, 
  color: '#6e45e2' 
};

const robotFaceStyle: React.CSSProperties = { 
  position: 'relative', 
  width: '60px', 
  height: '60px', 
  borderRadius: '50%', 
  backgroundColor: '#fff', 
  zIndex: 3, 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  gap: '8px', 
  boxShadow: '0 4px 15px rgba(0,0,0,0.08)' 
};

const eyeStyle: React.CSSProperties = { 
  width: '7px', 
  height: '14px', 
  background: 'linear-gradient(to bottom, #6366f1, #a855f7)', 
  borderRadius: '4px', 
  transition: 'transform 0.1s ease-out' 
};

const outerBorderStyle: React.CSSProperties = { 
  position: 'absolute', 
  width: '100%', 
  height: '110%', 
  borderRadius: '42%', 
  background: 'linear-gradient(45deg, #6e45e2, #3b82f6)', 
  animation: 'orbit-1 5s linear infinite', 
  zIndex: 1 
};

const innerBorderStyle: React.CSSProperties = { 
  position: 'absolute', 
  width: '110%', 
  height: '100%', 
  borderRadius: '45%', 
  background: 'linear-gradient(-45deg, #a855f7, #0ea5e9)', 
  animation: 'orbit-2 4s linear infinite', 
  zIndex: 2, 
  opacity: 0.8 
};

const chatWindowStyle: React.CSSProperties = { 
  position: 'fixed', 
  bottom: '210px', 
  right: '30px', 
  width: '320px', 
  height: '480px', 
  backgroundColor: '#fff', 
  borderRadius: '28px', 
  boxShadow: '0 25px 60px rgba(0,0,0,0.15)', 
  zIndex: 1000, 
  overflow: 'hidden', 
  display: 'flex', 
  flexDirection: 'column', 
  border: '1px solid #f0f0f0' 
};

const headerStyle: React.CSSProperties = { 
  background: 'linear-gradient(135deg, #6e45e2, #3b82f6)', 
  color: '#fff', 
  padding: '16px 20px', 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center' 
};

const menuIconStyle: React.CSSProperties = { 
  background: 'none', 
  border: 'none', 
  color: '#fff', 
  cursor: 'pointer', 
  display: 'flex', 
  alignItems: 'center', 
  padding: '4px' 
};

const dropdownMenuStyle: React.CSSProperties = { 
  position: 'absolute', 
  top: '35px', 
  right: '0', 
  backgroundColor: '#fff', 
  borderRadius: '16px', 
  boxShadow: '0 10px 30px rgba(0,0,0,0.12)', 
  overflow: 'hidden', 
  width: '160px', 
  zIndex: 1001, 
  border: '1px solid #f1f5f9' 
};

const menuItemStyle: React.CSSProperties = { 
  width: '100%', 
  padding: '12px 16px', 
  border: 'none', 
  background: 'none', 
  textAlign: 'center', 
  fontSize: '13px', 
  cursor: 'pointer', 
  color: '#1e293b', 
  borderBottom: '1px solid #f1f5f9', 
  fontWeight: 500 
};

const chatBodyStyle: React.CSSProperties = { 
  flex: 1, 
  padding: '20px', 
  overflowY: 'auto', 
  backgroundColor: '#fcfcfc' 
};

const messageBubbleStyle: React.CSSProperties = { 
  maxWidth: '85%', 
  padding: '12px 16px', 
  fontSize: '13px', 
  lineHeight: '1.5' 
};

const footerActionStyle: React.CSSProperties = { 
  padding: '15px 20px', 
  borderTop: '1px solid #f1f5f9', 
  backgroundColor: '#fff' 
};

const sectionTitleStyle: React.CSSProperties = { 
  fontSize: '10px', 
  color: '#94a3b8', 
  marginBottom: '8px', 
  fontWeight: 700, 
  letterSpacing: '0.05em', 
  textTransform: 'uppercase' 
};

const smallBtnStyle: React.CSSProperties = { 
  padding: '8px 12px', 
  backgroundColor: '#f8fafc', 
  border: '1px solid #e2e8f0', 
  borderRadius: '12px', 
  cursor: 'pointer', 
  fontSize: '11px', 
  color: '#334155', 
  fontWeight: 600 
};