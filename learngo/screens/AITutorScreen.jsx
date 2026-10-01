'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Send, Upload, FileText, Bot, User, Copy, Check,
  Sparkles, ChevronDown, X, Loader, Code2, RotateCcw,
  Paperclip, Lightbulb,
} from 'lucide-react'
import { user } from '../data/mockData'
import { useGame } from '../context/GameContext'

// ─── Code Block with Copy + Highlight ──────────────────────────────────────
function CodeBlock({ code, language = 'python' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const lines = code.split('\n')

  return (
    <div className="code-block my-2 group">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Code2 size={14} className="text-cyan-DEFAULT" />
          <span className="text-xs text-slate-DEFAULT font-mono font-medium">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-DEFAULT hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/8"
        >
          {copied ? <Check size={12} className="text-emerald-DEFAULT" /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="px-0 py-2 overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="hover:bg-white/4 group/line transition-colors">
                <td className="select-none text-right pr-4 pl-4 py-0.5 text-slate-DEFAULT/40 font-mono w-8 border-r border-white/5">
                  {i + 1}
                </td>
                <td className="pl-4 pr-4 py-0.5 font-mono text-slate-light whitespace-pre">
                  {line || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Chat Message Bubble ────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'

  const renderContent = (content) => {
    // Simple markdown-like rendering: **bold**, `code`, code blocks
    const parts = content.split(/(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const match = part.slice(3, -3)
        const firstLine = match.split('\n')[0]
        const lang = firstLine.trim()
        const code = lang ? match.slice(firstLine.length + 1) : match
        return <CodeBlock key={i} code={code.trim()} language={lang || 'python'} />
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-navy text-cyan-DEFAULT px-1.5 py-0.5 rounded-md font-mono text-xs">{part.slice(1,-1)}</code>
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-semibold">{part.slice(2,-2)}</strong>
      }
      return <span key={i}>{part}</span>
    })
  }

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 animate-slide-up">
        <div className="max-w-[80%]">
          <div className="bg-orange-DEFAULT/20 border border-orange-DEFAULT/30 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
            {msg.content}
          </div>
          <p className="text-right text-xs text-slate-DEFAULT/50 mt-1">{msg.time}</p>
        </div>
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-DEFAULT to-orange-glow flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-1 shadow-orange-glow/40">
          {user.name[0]}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 animate-slide-up">
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-DEFAULT to-emerald-DEFAULT flex items-center justify-center flex-shrink-0 mt-1 shadow-cyan-glow">
        <Bot size={14} className="text-white" />
      </div>
      <div className="max-w-[85%]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-cyan-DEFAULT">LearnGo AI</span>
          <span className="text-xs text-slate-DEFAULT/40">Socratic Mode</span>
        </div>
        <div className="glass-card border border-white/8 text-slate-light rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed">
          {renderContent(msg.content)}
        </div>
        <p className="text-xs text-slate-DEFAULT/50 mt-1">{msg.time}</p>
      </div>
    </div>
  )
}

// ─── PDF Upload Zone ────────────────────────────────────────────────────────
function PDFUploadZone({ onUpload }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(null)
  const inputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') processFile(file)
  }

  const processFile = (file) => {
    setUploading(true)
    setTimeout(() => {
      setUploading(false)
      setUploaded(file.name)
      onUpload(file.name)
    }, 2200)
  }

  if (uploaded) {
    return (
      <div className="rounded-2xl border border-emerald-DEFAULT/30 bg-emerald-DEFAULT/8 p-4 flex items-center gap-3 animate-fade-in">
        <div className="w-10 h-10 bg-emerald-DEFAULT/20 rounded-xl flex items-center justify-center">
          <FileText size={20} className="text-emerald-DEFAULT" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white truncate">{uploaded}</p>
          <p className="text-xs text-emerald-DEFAULT">✓ Parsed & summarized by AI</p>
        </div>
        <button onClick={() => setUploaded(null)} className="text-slate-DEFAULT hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`rounded-2xl border-2 border-dashed transition-all duration-200 p-5 text-center cursor-pointer
        ${dragging
          ? 'border-orange-DEFAULT bg-orange-DEFAULT/10'
          : 'border-white/15 hover:border-orange-DEFAULT/40 hover:bg-orange-DEFAULT/5'
        }`}
    >
      <input ref={inputRef} type="file" accept=".pdf" className="hidden"
        onChange={e => e.target.files[0] && processFile(e.target.files[0])} />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader size={24} className="text-cyan-DEFAULT animate-spin" />
          <p className="text-sm text-slate-DEFAULT">AI is parsing your PDF…</p>
          <div className="w-40 h-1.5 bg-navy rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-DEFAULT to-emerald-DEFAULT rounded-full animate-pulse" style={{ width: '65%' }} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-navy border border-white/10 flex items-center justify-center mb-1">
            <Upload size={22} className="text-orange-DEFAULT" />
          </div>
          <p className="text-sm font-semibold text-white">Drop your lecture PDF here</p>
          <p className="text-xs text-slate-DEFAULT">or click to browse · PDF up to 50MB</p>
        </div>
      )}
    </div>
  )
}

// ─── AI Summary Panel ───────────────────────────────────────────────────────
function AISummaryPanel({ filename }) {
  const summaryPoints = [
    'Memory hierarchy: registers → L1/L2/L3 cache → RAM → disk, each level has different speed/capacity trade-offs.',
    'Spatial locality: nearby memory addresses are likely to be accessed together (e.g., array traversal).',
    'Temporal locality: recently accessed data is likely to be accessed again soon (e.g., loop variables).',
    'Write-back policy: changes are written to cache first; main memory updated only when cache line is evicted.',
    'Cache miss penalty is the main bottleneck — minimizing misses is critical for performance optimization.',
  ]
  const references = [
    'Patterson & Hennessy — Computer Organization and Design, Ch. 5',
    'Tanenbaum — Modern Operating Systems, Section 4.3',
    'CS102 Lecture Slides: Week 4, Slides 18–34',
  ]

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={16} className="text-cyan-DEFAULT" />
        <p className="text-sm font-semibold text-white">AI Summary of <span className="text-cyan-DEFAULT">{filename}</span></p>
      </div>
      <div className="glass-card rounded-2xl border border-cyan-DEFAULT/20 p-4 space-y-2">
        <p className="text-xs font-semibold text-cyan-DEFAULT uppercase tracking-widest">Key Concepts</p>
        {summaryPoints.map((point, i) => (
          <div key={i} className="flex gap-2.5 text-sm">
            <div className="w-5 h-5 rounded-full bg-cyan-DEFAULT/15 text-cyan-DEFAULT text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</div>
            <p className="text-slate-light leading-relaxed">{point}</p>
          </div>
        ))}
      </div>
      <div className="glass-card rounded-2xl border border-white/8 p-4">
        <p className="text-xs font-semibold text-slate-DEFAULT uppercase tracking-widest mb-2">References</p>
        {references.map((ref, i) => (
          <p key={i} className="text-xs text-slate-DEFAULT flex items-start gap-1.5 mb-1">
            <span className="text-orange-DEFAULT mt-0.5">•</span> {ref}
          </p>
        ))}
      </div>
    </div>
  )
}

// ─── Main AI Tutor Screen ───────────────────────────────────────────────────
const MODES = ['Socratic', 'Guided']

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'assistant',
    content: "Hi there! 👋 I'm your **Socratic AI Tutor**. I won't just hand you answers — instead, I'll guide your thinking step-by-step so you build deep understanding.\n\nWhat are you working on today? You can ask me a concept, upload your lecture PDF, or try: *\"Explain Merge Sort to me.\"*",
    time: 'Just now',
  },
]

const EXAMPLE_PROMPTS = [
  'Explain Merge Sort step by step',
  'What is Big-O notation?',
  'How does a Queue work in memory?',
  'Difference between Stack and Heap',
]

export default function AITutorScreen() {
  const { socraticMode, setSocraticMode, setToast } = useGame()
  // Sync local display mode with GameContext socraticMode
  const mode = socraticMode === 'strict' ? 'Socratic' : 'Guided'
  const setMode = (m) => setSocraticMode(m === 'Socratic' ? 'strict' : 'guided')

  const [messages, setMessages]       = useState(INITIAL_MESSAGES)
  const [input, setInput]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [modeOpen, setModeOpen]       = useState(false)
  const [activeTab, setActiveTab]     = useState('chat')   // 'chat' | 'pdf'
  const [uploadedFile, setUploadedFile] = useState(null)
  const [showSummary, setShowSummary] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)
  // Monotonic message id. A counter avoids Date.now() so ids stay stable and
  // never collide when two messages land in the same millisecond.
  const msgId    = useRef(0)
  const nextId   = () => ++msgId.current

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed) return
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsg = { id: nextId(), role: 'user', content: trimmed, time }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Langflow is called server-side through /api/tutor. The API key stays on
    // the server and the off-topic guard cannot be bypassed from the client.
    const history = [...messages, userMsg]
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-6)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, mode: socraticMode, history }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        // 401 means the session went away — usually the tab sat idle long enough
        // for the token to expire. Anything else is a server-side problem.
        throw new Error(
          res.status === 401
            ? 'Your session expired. Please sign in again.'
            : data.error || 'The AI tutor is unreachable right now.',
        )
      }

      setMessages(prev => [...prev, { id: nextId(), role: 'assistant', content: data.reply, time }])
    } catch (err) {
      console.error('Tutor error:', err)
      setToast(`⚠️ ${err.message}`)
      setMessages(prev => [...prev, {
        id: nextId(),
        role: 'assistant',
        content: `Maaf, saya sedang tidak bisa merespons. (${err.message})`,
        time,
      }])
    }

    setLoading(false)
  }

  const handlePDFUpload = (filename) => {
    setUploadedFile(filename)
    setTimeout(() => setShowSummary(true), 400)
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages(prev => [
      ...prev,
      { id: nextId(), role: 'user', content: `I've uploaded my lecture notes: **${filename}**. Please summarize the key concepts.`, time },
    ])
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: nextId(),
        role: 'assistant',
        content: `Great! I've parsed **${filename}**. I found 5 key concepts related to Memory Hierarchy and Cache Systems. I've generated a structured summary — you can see it in the PDF panel above.\n\nNow, let me ask you: **Before reading the summary, what do you already know about L1, L2, and L3 cache?** This will help me tailor my Socratic questions to fill your specific gaps.`,
        time,
      }])
    }, 2800)
  }

  const resetChat = () => {
    setMessages(INITIAL_MESSAGES)
    setUploadedFile(null)
    setShowSummary(false)
  }

  return (
    <div className="flex flex-col h-full animate-fade-in" style={{ height: 'calc(100vh - 4rem - 4rem)' }}>
      {/* Sub-header */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* Tab switcher */}
        <div className="flex glass-card rounded-xl border border-white/8 p-0.5 gap-0.5">
          {['chat', 'pdf'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-150
                ${activeTab === tab ? 'bg-orange-DEFAULT text-white shadow-orange-glow/30' : 'text-slate-DEFAULT hover:text-white'}`}>
              {tab === 'chat' ? '💬 Chat' : '📄 PDF Tools'}
            </button>
          ))}
        </div>

        {/* Mode selector */}
        <div className="relative ml-auto">
          <button onClick={() => setModeOpen(o => !o)}
            className="flex items-center gap-2 glass-card border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white hover:border-orange-DEFAULT/30 transition-colors">
            <Lightbulb size={13} className="text-orange-DEFAULT" />
            {mode} Mode <ChevronDown size={12} />
          </button>
          {modeOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setModeOpen(false)} />
              <div className="absolute right-0 top-9 w-40 glass-card rounded-xl border border-white/10 z-20 overflow-hidden animate-slide-up">
                {MODES.map(m => (
                  <button key={m} onClick={() => { setMode(m); setModeOpen(false) }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors
                      ${mode === m ? 'text-orange-DEFAULT bg-orange-DEFAULT/10' : 'text-slate-DEFAULT hover:text-white hover:bg-white/5'}`}>
                    {m === 'Socratic' ? '🧠 Socratic (Guided Questions)' : '💡 Guided (Hints + Hints)'}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Reset */}
        <button onClick={resetChat} className="p-1.5 rounded-xl text-slate-DEFAULT hover:text-white hover:bg-white/8 transition-colors" title="Reset chat">
          <RotateCcw size={14} />
        </button>
      </div>

      {/* PDF panel (conditional) */}
      {activeTab === 'pdf' && (
        <div className="mb-3 space-y-3">
          <PDFUploadZone onUpload={handlePDFUpload} />
          {showSummary && uploadedFile && <AISummaryPanel filename={uploadedFile} />}
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0">
        {/* Example prompts — show only at start */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {EXAMPLE_PROMPTS.map(p => (
              <button key={p} onClick={() => sendMessage(p)}
                className="text-xs glass-card border border-white/10 hover:border-orange-DEFAULT/30 text-slate-DEFAULT hover:text-white rounded-xl px-3 py-1.5 transition-all duration-150">
                {p}
              </button>
            ))}
          </div>
        )}

        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}

        {loading && (
          <div className="flex gap-3 animate-slide-up">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-DEFAULT to-emerald-DEFAULT flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="glass-card border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 bg-cyan-DEFAULT rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="mt-3 glass-card rounded-2xl border border-white/10 p-2 flex items-end gap-2 focus-within:border-orange-DEFAULT/30 transition-colors">
        <button className="p-2 rounded-xl text-slate-DEFAULT hover:text-orange-DEFAULT transition-colors flex-shrink-0" title="Attach file"
          onClick={() => setActiveTab('pdf')}>
          <Paperclip size={18} />
        </button>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder={`Ask a question in ${mode} mode… (Enter to send)`}
          rows={1}
          className="flex-1 bg-transparent text-white text-sm placeholder-slate-DEFAULT/60 resize-none focus:outline-none leading-relaxed py-1.5 max-h-32 overflow-y-auto"
          style={{ minHeight: '36px' }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-orange-DEFAULT hover:bg-orange-glow text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow-orange-glow/40"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
