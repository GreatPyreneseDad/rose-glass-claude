import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { RoseGlassConversation, type Message } from '../services/conversation';
import type { Mode } from '../utils/commands';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function ChatPage() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<Mode>('analyze');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const conversation = useRef(new RoseGlassConversation()).current;
  const sessionIdRef = useRef<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // ── Auto-persist: create session on first exchange, append on subsequent ──

  const persistMessages = async (userMsg: Message, assistantMsg: Message, mode: Mode) => {
    if (!user) return;

    try {
      let sid = sessionIdRef.current;

      // Create session on first message
      if (!sid) {
        const { data: newSession, error: sessionError } = await supabase
          .from('sessions')
          .insert({ user_id: user.id, mode })
          .select()
          .single();

        if (sessionError) throw sessionError;
        sid = newSession.id;
        sessionIdRef.current = sid;
        setSessionId(sid);
      }

      const rows = [
        {
          session_id: sid,
          user_id: user.id,
          role: userMsg.role,
          content: userMsg.content,
          mode,
        },
        {
          session_id: sid,
          user_id: user.id,
          role: assistantMsg.role,
          content: assistantMsg.content,
          mode: assistantMsg.mode || mode,
          psi:         assistantMsg.dimensions?.psi         ?? null,
          rho:         assistantMsg.dimensions?.rho         ?? null,
          q:           assistantMsg.dimensions?.q           ?? null,
          f:           assistantMsg.dimensions?.f           ?? null,
          distortion:  assistantMsg.dimensions?.distortion  ?? null,
          truth_value: assistantMsg.dimensions?.truth_value ?? null,
          trs:         assistantMsg.dimensions?.trs         ?? null,
          meta_analysis: assistantMsg.metaNotes || null,
        },
      ];

      const { error: msgError } = await supabase.from('messages').insert(rows);
      if (msgError) console.error('Auto-save failed:', msgError);

    } catch (err) {
      console.error('Persist error:', err);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) {
      setError('Please enter text to analyze');
      return;
    }

    const messageWithMode = `/${selectedMode} ${inputText}`;
    const userMessage: Message = {
      role: 'user',
      content: inputText,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    setError(null);

    try {
      const result = await conversation.analyze(messageWithMode, messages);

      const assistantMessage: Message = {
        role: 'assistant',
        content: result.analysis,
        timestamp: new Date().toISOString(),
        metaNotes: result.metaNotes,
        mode: result.mode,
        dimensions: result.dimensions,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Auto-save both messages immediately
      await persistMessages(userMessage, assistantMessage, selectedMode);

    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : 'An error occurred';
      if (errorMessage.includes('overloaded') || errorMessage.includes('529')) {
        errorMessage = '⚠️ Claude API is currently experiencing high traffic. Please try again in a few minutes.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      {/* Header */}
      <div className="bg-[var(--sidebar-bg)] border-b border-[var(--border)] px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--accent-hot)]">Rose Glass</h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">Coherence-Building Translation System</p>
          </div>
          <div className="text-right flex items-center gap-4">
            {sessionId && (
              <span className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-sm">
                ✓ Auto-saving
              </span>
            )}
            <Link
              to="/history"
              className="px-3 py-1.5 border border-[var(--border)] text-[var(--text-secondary)] rounded-lg hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)] transition-colors text-sm"
            >
              History
            </Link>
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 border border-[var(--border)] text-[var(--text-secondary)] rounded-lg hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)] transition-colors text-sm"
            >
              Sign Out
            </button>
            <div className="text-[var(--text-muted)] text-xs">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">No messages yet. Start a conversation to begin building coherence.</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
                    {[['Ψ','Internal Consistency','purple'],['ρ','Witness Density','pink'],['q','Moral/Emotional Activation','purple'],['f','Social Belonging','pink']].map(([sym,label,color]) => (
                      <div key={sym} className={`bg-slate-800/50 p-3 rounded-lg border border-${color}-500/10`}>
                        <div className={`text-xl font-bold text-${color}-400`}>{sym}</div>
                        <div className="text-xs text-gray-400 mt-1">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div className={`max-w-3xl border rounded-lg p-4 ${msg.role === 'user' ? 'bg-purple-600/20 border-purple-500/30' : 'bg-slate-800 border-slate-700'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-purple-500' : 'bg-gradient-to-br from-purple-500 to-pink-600'}`}>
                        <span className="text-white text-sm font-medium">{msg.role === 'user' ? 'U' : 'RG'}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-gray-300 whitespace-pre-wrap text-sm">{msg.content}</div>
                        {msg.dimensions && msg.role === 'assistant' && (
                          <div className="mt-2 flex gap-3 flex-wrap">
                            {(['psi','rho','q','f'] as const).map(dim => msg.dimensions![dim] !== null && (
                              <span key={dim} className="text-xs bg-purple-500/10 border border-purple-500/20 rounded px-2 py-0.5 text-purple-300">
                                {dim === 'psi' ? 'Ψ' : dim === 'rho' ? 'ρ' : dim} {msg.dimensions![dim]?.toFixed(2)}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="text-gray-500 text-xs mt-2">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-gray-400 text-sm">Translating through Rose Glass...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-purple-500/20 bg-slate-900/50 px-6 py-4">
            <div className="max-w-4xl mx-auto">
              {error && (
                <div className="mb-3 text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded px-3 py-2">{error}</div>
              )}
              <div className="mb-3 flex gap-2">
                {(['analyze','translate','reflect'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedMode(m)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedMode === m ? 'bg-[var(--accent-primary)] text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'}`}
                  >
                    <span className="font-mono">/{m}</span>
                    <span className="ml-2 text-xs opacity-75">{m === 'analyze' ? 'Full dimensional output' : m === 'translate' ? 'Plain language' : 'Conversation mode'}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={`Enter text for Rose Glass ${selectedMode} mode...`}
                  className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={3}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !inputText.trim()}
                  className="px-6 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
              <div className="text-gray-500 text-xs mt-2">Press Enter to send, Shift+Enter for new line</div>
            </div>
          </div>
        </div>

        {/* Meta-Notes Sidebar */}
        <div className="w-96 bg-slate-900/50 border-l border-purple-500/20 flex flex-col">
          <div className="px-4 py-3 border-b border-purple-500/20">
            <h2 className="text-sm font-semibold text-purple-400">Coherence Meta-Notes</h2>
            <p className="text-xs text-gray-500 mt-1">Internal analysis tracking</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.filter(msg => msg.role === 'assistant' && msg.metaNotes).map((msg, idx) => (
              <div key={idx} className="bg-slate-800/50 border border-purple-500/10 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-2">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                <div className="text-xs text-gray-300 whitespace-pre-wrap">{msg.metaNotes}</div>
              </div>
            ))}
            {messages.filter(msg => msg.metaNotes).length === 0 && (
              <div className="text-center py-8 text-gray-500 text-xs">Meta-notes will appear here as the conversation develops.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
