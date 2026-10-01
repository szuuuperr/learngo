'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { X, Heart, Star, Check, ChevronRight, RotateCcw, Zap } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { lessonsByLang } from '../data/curriculum'

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:      '#0A0F1E',
  surface: '#0F172A',
  card:    '#131B2E',
  card2:   '#1A2235',
  border:  '#1E2D45',
  orange:  '#FF7A00',
  cyan:    '#22D3EE',
  green:   '#34D399',
  red:     '#F87171',
  purple:  '#A78BFA',
  text:    '#F1F5F9',
  muted:   '#475569',
  light:   '#CBD5E1',
}

const langMeta = {
  python:     { label: 'Python',     color: '#4ADE80', dot: '#22C55E', icon: '🐍' },
  javascript: { label: 'JavaScript', color: '#FCD34D', dot: '#F59E0B', icon: '🟡' },
  cpp:        { label: 'C++',        color: '#C084FC', dot: '#A855F7', icon: '⚙️' },
  dsa:        { label: 'DSA',        color: '#34D399', dot: '#10B981', icon: '🌳' },
}

// ─── CSS keyframes (injected once) ───────────────────────────────────────────
const KEYFRAMES = `
  @keyframes xpBurst {
    0%   { opacity:0; transform:translateX(-50%) translateY(20px) scale(0.7); }
    25%  { opacity:1; transform:translateX(-50%) translateY(-12px) scale(1.1); }
    65%  { opacity:1; transform:translateX(-50%) translateY(-12px) scale(1); }
    100% { opacity:0; transform:translateX(-50%) translateY(-38px) scale(0.9); }
  }
  @keyframes trophyPop {
    0%   { transform:scale(0) rotate(-18deg); opacity:0; }
    55%  { transform:scale(1.2) rotate(4deg); opacity:1; }
    100% { transform:scale(1) rotate(0); opacity:1; }
  }
  @keyframes starCascade {
    0%   { transform:scale(0) rotate(-25deg); opacity:0; }
    60%  { transform:scale(1.15) rotate(8deg); opacity:1; }
    100% { transform:scale(1) rotate(0); opacity:1; }
  }
  @keyframes shakeX {
    0%,100% { transform:translateX(0); }
    15%     { transform:translateX(-9px) rotate(-2deg); }
    30%     { transform:translateX(9px) rotate(2deg); }
    45%     { transform:translateX(-5px); }
    60%     { transform:translateX(5px); }
    75%     { transform:translateX(-2px); }
  }
  @keyframes bounceY {
    0%,100% { transform:translateY(0); }
    40%     { transform:translateY(-16px); }
    60%     { transform:translateY(-7px); }
  }
  @keyframes fadeSlideUp {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes spinStar {
    from { transform:rotate(-20deg) scale(0.8); }
    to   { transform:rotate(20deg) scale(1.1); }
  }
  @keyframes progressFill {
    from { width:0%; }
  }
  @keyframes heartBeat {
    0%   { transform:scale(1); }
    30%  { transform:scale(1.35); }
    60%  { transform:scale(0.9); }
    100% { transform:scale(1); }
  }
  @keyframes foxFloat {
    0%,100% { transform:translateY(0px); }
    50%     { transform:translateY(-8px); }
  }
  @keyframes glowPulse {
    0%,100% { box-shadow:0 0 12px rgba(255,122,0,0.3); }
    50%     { box-shadow:0 0 28px rgba(255,122,0,0.7); }
  }
`

// ─── Fox Mascot SVG ────────────────────────────────────────────────────────────
function FoxMascot({ mood = 'neutral', size = 84 }) {
  const eyeY     = mood === 'happy' ? 42 : mood === 'sad' ? 40 : 41
  const mouthPath = mood === 'happy'
    ? 'M41,58 Q48,64 55,58'
    : mood === 'sad'
    ? 'M41,62 Q48,57 55,62'
    : 'M42,60 Q48,62 54,60'

  return (
    <svg
      width={size} height={size} viewBox="0 0 96 96" fill="none"
      style={{ flexShrink: 0, animation: mood === 'happy' ? 'bounceY 0.7s ease-out' : mood === 'sad' ? 'shakeX 0.5s ease-out' : 'foxFloat 3.5s ease-in-out infinite' }}
    >
      {/* Glow ring */}
      {mood !== 'neutral' && (
        <circle cx={48} cy={48} r={45}
          fill={mood === 'happy' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)'}
          stroke={mood === 'happy' ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}
          strokeWidth={2}
        />
      )}
      {/* Ears */}
      <polygon points="14,28 24,8 36,26"  fill="#FF7A00"/>
      <polygon points="60,26 72,8 82,28"  fill="#FF7A00"/>
      <polygon points="18,27 24,14 33,26" fill="#FBBF24"/>
      <polygon points="63,26 72,14 78,27" fill="#FBBF24"/>
      {/* Head */}
      <ellipse cx={48} cy={50} rx={34} ry={31} fill="#FF7A00"/>
      {/* Cheek patches */}
      <ellipse cx={22} cy={56} rx={10} ry={7} fill="#FB923C" opacity="0.6"/>
      <ellipse cx={74} cy={56} rx={10} ry={7} fill="#FB923C" opacity="0.6"/>
      {/* Muzzle */}
      <ellipse cx={48} cy={62} rx={16} ry={11} fill="#FEF3C7"/>
      {/* Eyes */}
      <ellipse cx={36} cy={eyeY} rx={6.5} ry={mood === 'sad' ? 5.5 : 7} fill="white"/>
      <ellipse cx={60} cy={eyeY} rx={6.5} ry={mood === 'sad' ? 5.5 : 7} fill="white"/>
      <circle cx={37} cy={eyeY + 1} r={4} fill="#1E293B"/>
      <circle cx={61} cy={eyeY + 1} r={4} fill="#1E293B"/>
      <circle cx={38.5} cy={eyeY - 1} r={1.5} fill="white" opacity="0.8"/>
      <circle cx={62.5} cy={eyeY - 1} r={1.5} fill="white" opacity="0.8"/>
      {/* Sad brows */}
      {mood === 'sad' && (
        <>
          <path d="M30,33 Q36,29 40,33" stroke="#FF7A00" strokeWidth="2.5" strokeLinecap="round" fill="none" transform="rotate(8,35,31)"/>
          <path d="M56,33 Q60,29 66,33" stroke="#FF7A00" strokeWidth="2.5" strokeLinecap="round" fill="none" transform="rotate(-8,61,31)"/>
        </>
      )}
      {/* Nose */}
      <ellipse cx={48} cy={57} rx={3.5} ry={2.5} fill="#C2410C"/>
      {/* Mouth */}
      <path d={mouthPath} stroke="#C2410C" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* Happy sparkles */}
      {mood === 'happy' && (
        <>
          <text x={8}  y={22} fontSize="13" style={{ animation:'spinStar 0.5s ease-out' }}>✦</text>
          <text x={78} y={18} fontSize="10" style={{ animation:'spinStar 0.5s ease-out 0.1s' }}>✦</text>
        </>
      )}
    </svg>
  )
}

// ─── Syntax highlighter ────────────────────────────────────────────────────────
const KEYWORDS = {
  python:     new Set(['def','if','else','elif','for','while','return','class','import','from','in','and','or','not','True','False','None','print','range','len','append','pass','break','continue','lambda']),
  javascript: new Set(['function','const','let','var','if','else','for','while','return','class','import','export','from','async','await','new','this','typeof','null','undefined','true','false']),
  cpp:        new Set(['int','double','float','char','bool','void','if','else','for','while','return','class','struct','cout','cin','const','include','using','namespace','std','string','auto','new','delete']),
  dsa:        new Set(['def','if','else','for','while','return','class','import','from','None','True','False','pass','break','lambda']),
}

function tokenColor(tok, lang) {
  const kws = KEYWORDS[lang] || KEYWORDS.python
  const t = tok.trim()
  if (kws.has(t)) return '#7DD3FC'
  if ((tok.startsWith('"') && tok.endsWith('"')) || (tok.startsWith("'") && tok.endsWith("'"))) return '#FCD34D'
  if (/^\d+(\.\d+)?$/.test(t)) return '#F9A8D4'
  if (t.startsWith('#') || t.startsWith('//')) return '#475569'
  return null
}

function HighlightedLine({ line, blankWord, lang, lineNum, showAnswer }) {
  if (!line && line !== '0') return (
    <div style={{ display: 'flex', gap: 14, padding: '3px 18px', fontFamily: '"JetBrains Mono","Fira Code",monospace', fontSize: 13 }}>
      <span style={{ color: T.border, minWidth: 18, textAlign: 'right', userSelect: 'none' }}>{lineNum}</span>
      <span>&nbsp;</span>
    </div>
  )

  const tokens = line.split(/(\s+|[(),\[\]{}:=+\-*/<>!&|;])/).filter(t => t !== '')

  return (
    <div style={{ display: 'flex', gap: 14, padding: '4px 18px', fontFamily: '"JetBrains Mono","Fira Code",monospace', fontSize: 13, lineHeight: 1.75 }}>
      <span style={{ color: T.muted, minWidth: 18, textAlign: 'right', userSelect: 'none', fontSize: 11.5 }}>{lineNum}</span>
      <span style={{ whiteSpace: 'pre', color: T.text }}>
        {tokens.map((tok, i) => {
          if (tok === '___') {
            if (showAnswer) {
              return (
                <span key={i} style={{ color: T.green, background: 'rgba(52,211,153,0.15)', border: `1px solid rgba(52,211,153,0.4)`, borderRadius: 5, padding: '0 8px', fontWeight: 700 }}>
                  {blankWord}
                </span>
              )
            }
            return (
              <span key={i} style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1.5px dashed rgba(245,158,11,0.45)', borderRadius: 5, padding: '0 16px', letterSpacing: 3 }}>
                ___
              </span>
            )
          }
          const sc = tokenColor(tok, lang)
          return <span key={i} style={{ color: sc || T.text }}>{tok}</span>
        })}
      </span>
    </div>
  )
}

function CodeBlock({ lines = [], language = 'python', output, blankWord, showAnswer }) {
  const meta = langMeta[language] || langMeta.python
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const text = lines.join('\n').replace('___', blankWord || '___')
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.border}` }}>
      {/* Bar */}
      <div style={{ background: '#0D1526', padding: '7px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#F87171' }}/>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#FCD34D' }}/>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#34D399' }}/>
          </div>
          <span style={{ color: meta.color, fontSize: 11, fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, letterSpacing: 1, marginLeft: 4 }}>
            {meta.icon} {meta.label.toLowerCase()}
          </span>
        </div>
        <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? T.green : T.muted, fontSize: 11, fontFamily: '"JetBrains Mono",monospace', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 6, transition: 'color 0.2s' }}>
          {copied ? <><Check size={10}/> Copied!</> : '⎘ Copy'}
        </button>
      </div>
      {/* Lines */}
      <div style={{ background: '#080E1C', paddingTop: 6, paddingBottom: 6 }}>
        {lines.map((line, i) => (
          <HighlightedLine key={i} line={line} blankWord={blankWord} lang={language} lineNum={i + 1} showAnswer={showAnswer}/>
        ))}
      </div>
      {/* Output */}
      {output && (
        <div style={{ background: '#060D1A', borderTop: `1px solid ${T.border}`, padding: '7px 16px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ color: T.muted, fontSize: 10, fontFamily: '"JetBrains Mono",monospace', marginTop: 3, userSelect: 'none' }}>▶ output</span>
          <pre style={{ color: '#86EFAC', fontFamily: '"JetBrains Mono",monospace', fontSize: 12.5, margin: 0, lineHeight: 1.6 }}>{output}</pre>
        </div>
      )}
    </div>
  )
}

// ─── Explanation text with `code` and **bold** ────────────────────────────────
function ExplainText({ text }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/)
  return (
    <span>
      {parts.map((p, i) => {
        if (p.startsWith('`') && p.endsWith('`'))
          return <code key={i} style={{ background: 'rgba(34,211,238,0.12)', color: T.cyan, padding: '1px 6px', borderRadius: 5, fontFamily: '"JetBrains Mono",monospace', fontSize: 12 }}>{p.slice(1, -1)}</code>
        if (p.startsWith('**') && p.endsWith('**'))
          return <strong key={i} style={{ color: 'white' }}>{p.slice(2, -2)}</strong>
        return <span key={i}>{p}</span>
      })}
    </span>
  )
}

// ─── Lives bar ────────────────────────────────────────────────────────────────
function LivesBar({ lives, max = 5 }) {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {Array.from({ length: max }).map((_, i) => (
        <Heart key={i} size={15}
          fill={i < lives ? '#F87171' : 'none'}
          color={i < lives ? '#F87171' : T.border}
          style={{ transition: 'all 0.3s', transform: i < lives ? 'scale(1)' : 'scale(0.8)' }}
        />
      ))}
    </div>
  )
}

// ─── Top progress bar ─────────────────────────────────────────────────────────
function TopBar({ progress, lives, maxLives, onClose, title, qNum, qTotal, lang }) {
  const meta = langMeta[lang] || langMeta.python
  return (
    <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 20 }}>
      <button
        onClick={onClose}
        style={{ background: 'none', border: `1.5px solid ${T.border}`, cursor: 'pointer', color: T.muted, padding: '5px 6px', borderRadius: 9, display: 'flex', transition: 'all 0.15s', flexShrink: 0 }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = T.red; e.currentTarget.style.color = T.red }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted }}
      >
        <X size={15}/>
      </button>

      <div style={{ flex: 1 }}>
        <div style={{ height: 7, background: T.card2, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: `linear-gradient(90deg, ${meta.dot}, ${T.cyan})`,
            borderRadius: 99,
            transition: 'width 0.55s cubic-bezier(0.22,1,0.36,1)',
            boxShadow: `0 0 7px ${meta.dot}80`,
          }}/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
          <span style={{ color: T.muted, fontSize: 10.5 }}>{title}</span>
          <span style={{ color: meta.color, fontSize: 10.5, fontWeight: 700 }}>{qNum}/{qTotal}</span>
        </div>
      </div>

      <LivesBar lives={lives} max={maxLives}/>
    </div>
  )
}

// ─── XP Burst animation ───────────────────────────────────────────────────────
function XPBurst({ xp, visible }) {
  if (!visible) return null
  return (
    <div style={{
      position: 'fixed', top: '18%', left: '50%', transform: 'translateX(-50%)',
      zIndex: 300, pointerEvents: 'none',
      animation: 'xpBurst 1.3s cubic-bezier(0.16,1,0.3,1) forwards',
    }}>
      <div style={{
        background: 'linear-gradient(135deg,#FF7A00,#F59E0B)',
        borderRadius: 99, padding: '11px 28px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 14px 44px rgba(255,122,0,0.55)',
      }}>
        <Star size={22} fill="white" color="white"/>
        <span style={{ color: 'white', fontWeight: 900, fontSize: 24, letterSpacing: '-0.03em' }}>+{xp} XP</span>
        <Star size={16} fill="white" color="white"/>
      </div>
    </div>
  )
}

// ─── Answer option button ─────────────────────────────────────────────────────
function OptionBtn({ label, index, selected, correctIdx, confirmed, onSelect, disabled }) {
  const letter = String.fromCharCode(65 + index)
  const isSelected = selected === index
  const isCorrect  = index === correctIdx

  let bg     = T.card2
  let border = T.border
  let color  = T.light
  let shadow = 'none'

  if (confirmed) {
    if (isCorrect) {
      bg = 'rgba(52,211,153,0.13)'; border = T.green; color = T.green
      shadow = '0 0 18px rgba(52,211,153,0.2)'
    } else if (isSelected) {
      bg = 'rgba(248,113,113,0.13)'; border = T.red; color = T.red
      shadow = '0 0 12px rgba(248,113,113,0.15)'
    } else {
      bg = T.card; border = `${T.border}50`; color = `${T.muted}80`
    }
  }

  const letterBg = confirmed
    ? isCorrect ? T.green : isSelected ? T.red : T.muted
    : isSelected ? T.orange : T.muted

  return (
    <button
      onClick={() => !confirmed && !disabled && onSelect(index)}
      disabled={disabled}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 16px', borderRadius: 14, cursor: confirmed ? 'default' : 'pointer',
        background: bg, border: `1.5px solid ${border}`, color,
        transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)',
        boxShadow: shadow, textAlign: 'left', outline: 'none',
        transform: isSelected && !confirmed ? 'translateY(-1px)' : 'none',
      }}
      onMouseEnter={e => { if (!confirmed && !disabled) e.currentTarget.style.borderColor = T.orange }}
      onMouseLeave={e => { if (!confirmed && !disabled) e.currentTarget.style.borderColor = border }}
    >
      <span style={{
        minWidth: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0,
        background: confirmed ? letterBg : isSelected ? T.orange : 'transparent',
        border: `1.5px solid ${letterBg}`,
        color: (confirmed && (isCorrect || isSelected)) || isSelected ? 'white' : T.muted,
        transition: 'all 0.2s',
      }}>
        {confirmed && isCorrect ? <Check size={13}/> : letter}
      </span>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}>{label}</span>
      {confirmed && isCorrect  && <span style={{ fontSize: 16 }}>✅</span>}
      {confirmed && isSelected && !isCorrect && <span style={{ fontSize: 16 }}>❌</span>}
    </button>
  )
}

// ─── Feedback panel ───────────────────────────────────────────────────────────
function FeedbackPanel({ correct, lesson, onNext, isLast }) {
  const [showWhy, setShowWhy] = useState(false)

  return (
    <div style={{
      position: 'sticky', bottom: 0, background: T.bg,
      borderTop: `1px solid ${T.border}`, padding: '14px 20px 20px',
      animation: 'fadeSlideUp 0.3s ease-out',
    }}>
      {/* Result banner */}
      <div style={{
        borderRadius: 12, padding: '12px 16px', marginBottom: 12,
        background: correct ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
        border: `1px solid ${correct ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
      }}>
        <p style={{
          fontWeight: 700, fontSize: 14, margin: '0 0 4px',
          color: correct ? T.green : T.red,
        }}>
          {correct ? '✅ Excellent! Keep going.' : '❌ Not quite — here\'s why:'}
        </p>
        {(!correct || showWhy) && (
          <p style={{ color: T.light, fontSize: 13, lineHeight: 1.55, margin: 0 }}>
            <ExplainText text={lesson.explanation}/>
          </p>
        )}
        {correct && (
          <button
            onClick={() => setShowWhy(w => !w)}
            style={{ background: 'none', border: 'none', color: T.cyan, fontSize: 12, cursor: 'pointer', padding: '2px 0', marginTop: 2, fontWeight: 600 }}
          >
            {showWhy ? '▲ Hide explanation' : '💡 Why? (Socratic insight)'}
          </button>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        style={{
          width: '100%', padding: '14px', borderRadius: 14, border: 'none',
          cursor: 'pointer', fontWeight: 800, fontSize: 15,
          background: correct
            ? `linear-gradient(135deg, ${T.green}, #22C55E)`
            : `linear-gradient(135deg, ${T.orange}, #F59E0B)`,
          color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: correct ? '0 6px 24px rgba(52,211,153,0.3)' : '0 6px 24px rgba(255,122,0,0.3)',
          animation: 'glowPulse 2s ease-in-out infinite',
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
      >
        {isLast ? '🏆 Finish Lesson' : 'Next Question'}
        <ChevronRight size={17}/>
      </button>
    </div>
  )
}

// ─── Question body ─────────────────────────────────────────────────────────────
function QuestionView({ lesson, onAnswer, mood, onMoodChange }) {
  const [selected,  setSelected]  = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  const handleSelect = (idx) => {
    if (confirmed) return
    setSelected(idx)
  }

  const handleConfirm = () => {
    if (selected === null || confirmed) return
    const correct = selected === lesson.correctOption
    setConfirmed(true)
    onMoodChange(correct ? 'happy' : 'sad')
    // Propagate result back after a tiny delay so UI settles first
    setTimeout(() => onAnswer(correct, lesson.xp), 0)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: confirmed ? 0 : 80 }}>
      {/* Mascot + speech */}
      <div style={{ display: 'flex', gap: 14, padding: '20px 20px 12px', alignItems: 'flex-end' }}>
        <FoxMascot mood={mood} size={76}/>
        <div style={{
          flex: 1, background: T.card2, borderRadius: '16px 16px 16px 4px',
          padding: '12px 16px', border: `1px solid ${T.border}`,
          animation: 'fadeSlideUp 0.35s ease-out',
        }}>
          <p style={{ color: T.orange, fontSize: 11, fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 }}>
            {lesson.instruction}
          </p>
          <p style={{ color: T.text, fontWeight: 600, fontSize: 14, margin: 0, lineHeight: 1.4 }}>
            {lesson.mascotSpeech}
          </p>
        </div>
      </div>

      {/* Code block */}
      {lesson.codeLines && lesson.codeLines.length > 0 && (
        <div style={{ padding: '0 20px 14px' }}>
          <CodeBlock
            lines={lesson.codeLines}
            language={lesson.lang || lesson.language || 'python'}
            output={confirmed ? lesson.codeOutput : undefined}
            blankWord={lesson.blankWord}
            showAnswer={confirmed && lesson.type === 'fill_blank'}
          />
        </div>
      )}

      {/* Options */}
      <div style={{ padding: '0 20px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {lesson.options.map((opt, i) => (
          <OptionBtn
            key={i}
            label={opt}
            index={i}
            selected={selected}
            correctIdx={lesson.correctOption}
            confirmed={confirmed}
            onSelect={handleSelect}
            disabled={confirmed}
          />
        ))}
      </div>

      {/* Confirm button (before answered) */}
      {!confirmed && (
        <div style={{ padding: '0 20px 20px' }}>
          <button
            onClick={handleConfirm}
            disabled={selected === null}
            style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none',
              cursor: selected === null ? 'not-allowed' : 'pointer',
              fontWeight: 800, fontSize: 15,
              background: selected === null
                ? 'rgba(255,255,255,0.07)'
                : `linear-gradient(135deg, ${T.orange}, #F59E0B)`,
              color: selected === null ? T.muted : 'white',
              transition: 'all 0.2s',
              boxShadow: selected !== null ? '0 6px 24px rgba(255,122,0,0.3)' : 'none',
            }}
          >
            Check Answer
          </button>
        </div>
      )}

      {/* Feedback panel */}
      {confirmed && (
        <FeedbackPanel correct={selected === lesson.correctOption} lesson={lesson} onNext={() => {}} isLast={false}/>
      )}
    </div>
  )
}

// ─── No lives screen ──────────────────────────────────────────────────────────
function NoLivesScreen({ onClose, onRestart }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center', animation: 'fadeSlideUp 0.4s ease-out' }}>
      <div style={{ animation: 'bounceY 0.8s ease-out', marginBottom: 16 }}>
        <FoxMascot mood="sad" size={100}/>
      </div>
      <h2 style={{ color: T.red, fontWeight: 900, fontSize: 26, margin: '0 0 8px' }}>Out of Lives!</h2>
      <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.55, margin: '0 0 28px', maxWidth: 280 }}>
        You&apos;ve used all your hearts. Practice more, come back stronger! ❤️
      </p>
      <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 300 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '13px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: 'none', color: T.light, cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.2s' }}>
          Exit
        </button>
        <button onClick={onRestart} style={{ flex: 1, padding: '13px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${T.orange},#F59E0B)`, color: 'white', cursor: 'pointer', fontWeight: 800, fontSize: 14, boxShadow: '0 6px 20px rgba(255,122,0,0.35)', transition: 'all 0.2s' }}>
          <RotateCcw size={14} style={{ display: 'inline', marginRight: 6 }}/>Retry
        </button>
      </div>
    </div>
  )
}

// ─── Completion screen ────────────────────────────────────────────────────────
function CompletionScreen({ totalXP, correct, total, lang, title, onClose }) {
  const meta = langMeta[lang] || langMeta.python
  const pct  = Math.round((correct / total) * 100)
  const stars = pct === 100 ? 3 : pct >= 60 ? 2 : 1

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center', animation: 'fadeSlideUp 0.4s ease-out' }}>
      {/* Trophy */}
      <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 12, animation: 'trophyPop 0.7s cubic-bezier(0.34,1.56,0.64,1) both' }}>🏆</div>

      {/* Stars */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, justifyContent: 'center' }}>
        {[0, 1, 2].map(i => (
          <Star key={i} size={32}
            fill={i < stars ? '#FCD34D' : 'none'}
            color={i < stars ? '#FCD34D' : T.border}
            style={{ animation: i < stars ? `starCascade 0.5s ${0.1 + i * 0.15}s ease-out both` : 'none' }}
          />
        ))}
      </div>

      <h2 style={{ color: 'white', fontWeight: 900, fontSize: 28, margin: '0 0 6px', letterSpacing: '-0.03em' }}>Lesson Complete!</h2>
      <p style={{ color: T.muted, fontSize: 14, margin: '0 0 24px' }}>{title}</p>

      {/* XP card */}
      <div style={{
        background: `linear-gradient(135deg, rgba(255,122,0,0.15), rgba(245,158,11,0.1))`,
        border: `1px solid rgba(255,122,0,0.35)`,
        borderRadius: 18, padding: '18px 28px', marginBottom: 18,
        display: 'flex', alignItems: 'center', gap: 14, width: '100%', maxWidth: 300,
        animation: 'glowPulse 2s ease-in-out infinite',
      }}>
        <Zap size={28} fill={T.orange} color={T.orange}/>
        <div style={{ textAlign: 'left' }}>
          <p style={{ color: T.orange, fontWeight: 900, fontSize: 26, margin: '0 0 2px', letterSpacing: '-0.02em' }}>+{totalXP} XP</p>
          <p style={{ color: T.muted, fontSize: 12, margin: 0 }}>{correct}/{total} correct · {pct}% accuracy</p>
        </div>
      </div>

      {/* Lang badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px',
        borderRadius: 99, border: `1px solid ${meta.color}40`,
        background: `${meta.color}10`, marginBottom: 28,
      }}>
        <span style={{ fontSize: 16 }}>{meta.icon}</span>
        <span style={{ color: meta.color, fontWeight: 700, fontSize: 13 }}>{meta.label} progress updated</span>
      </div>

      <button
        onClick={onClose}
        style={{
          width: '100%', maxWidth: 300, padding: '15px', borderRadius: 14, border: 'none',
          cursor: 'pointer', fontWeight: 900, fontSize: 16,
          background: `linear-gradient(135deg, ${meta.dot}, ${T.cyan})`,
          color: 'white', boxShadow: `0 8px 28px ${meta.dot}40`,
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
      >
        Continue Learning 🚀
      </button>
    </div>
  )
}

// ─── MAIN LessonScreen ────────────────────────────────────────────────────────
export default function LessonScreen({ lang = 'python', levelIndex = 0, title = 'Lesson', onClose, onComplete }) {
  const { lives: globalLives, maxLives, loseLife, earnXP, completeLevel } = useGame()

  // Build the question set for this session:
  // Take a window of up to 5 questions starting from levelIndex (wrapping around)
  const allLessons = useMemo(() => lessonsByLang[lang] || lessonsByLang.python, [lang])
  const sessionSize = Math.min(5, allLessons.length)
  const sessionLessons = useMemo(() => {
    const result = []
    for (let i = 0; i < sessionSize; i++) {
      result.push(allLessons[(levelIndex + i) % allLessons.length])
    }
    return result
  }, [allLessons, levelIndex, sessionSize])

  const [qIdx,      setQIdx]      = useState(0)
  const [livesLeft, setLivesLeft] = useState(globalLives)
  const [totalXP,   setTotalXP]   = useState(0)
  const [correctCt, setCorrectCt] = useState(0)
  const [showXP,    setShowXP]    = useState(false)
  const [xpAmount,  setXPAmount]  = useState(0)
  const [done,      setDone]      = useState(false)
  const [noLives,   setNoLives]   = useState(false)
  const [mood,      setMood]      = useState('neutral')
  const [key,       setKey]       = useState(0)     // force QuestionView remount on next q
  const [confirmed, setConfirmed] = useState(false) // tracks if current q is answered
  const [lastCorrect, setLastCorrect] = useState(null)
  const [answerXP,  setAnswerXP]  = useState(0)
  const feedbackRef = useRef(null)

  const lesson   = sessionLessons[qIdx]
  const progress = Math.round(((qIdx + (confirmed ? 1 : 0)) / sessionSize) * 100)

  // Reset mood back to neutral after animation plays
  useEffect(() => {
    if (mood !== 'neutral') {
      const t = setTimeout(() => setMood('neutral'), 800)
      return () => clearTimeout(t)
    }
  }, [mood])

  const handleAnswer = (correct, xp) => {
    setConfirmed(true)
    setLastCorrect(correct)

    if (correct) {
      earnXP(xp)
      setTotalXP(t => t + xp)
      setCorrectCt(c => c + 1)
      setXPAmount(xp)
      setShowXP(true)
      setTimeout(() => setShowXP(false), 1600)
    } else {
      loseLife()
      const newLives = Math.max(0, livesLeft - 1)
      setLivesLeft(newLives)
      if (newLives === 0) {
        setTimeout(() => setNoLives(true), 700)
      }
    }
  }

  const handleNext = () => {
    if (noLives) return
    const nextIdx = qIdx + 1
    if (nextIdx >= sessionSize) {
      // Session complete
      completeLevel(lang, levelIndex)
      setDone(true)
      onComplete?.()
    } else {
      setQIdx(nextIdx)
      setConfirmed(false)
      setLastCorrect(null)
      setMood('neutral')
      setKey(k => k + 1)
    }
  }

  const handleRestart = () => {
    setQIdx(0)
    setConfirmed(false)
    setLastCorrect(null)
    setLivesLeft(globalLives)
    setTotalXP(0)
    setCorrectCt(0)
    setDone(false)
    setNoLives(false)
    setMood('neutral')
    setKey(k => k + 1)
  }

  if (!lesson) return null

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div style={{
        position: 'fixed', inset: 0, background: T.bg,
        zIndex: 100, display: 'flex', flexDirection: 'column',
        overflowY: 'auto', overflowX: 'hidden',
        fontFamily: '"Plus Jakarta Sans","Inter",system-ui,sans-serif',
      }}>
        {/* XP burst */}
        <XPBurst xp={xpAmount} visible={showXP}/>

        {/* Top bar */}
        <TopBar
          progress={progress}
          lives={livesLeft}
          maxLives={maxLives}
          onClose={onClose}
          title={title || lesson.title}
          qNum={qIdx + 1}
          qTotal={sessionSize}
          lang={lang}
        />

        {/* Body */}
        {noLives ? (
          <NoLivesScreen onClose={onClose} onRestart={handleRestart}/>
        ) : done ? (
          <CompletionScreen
            totalXP={totalXP}
            correct={correctCt}
            total={sessionSize}
            lang={lang}
            title={title || lesson.title}
            onClose={onClose}
          />
        ) : (
          <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', animation: 'fadeSlideUp 0.3s ease-out' }}>
            {/* Mascot + speech + code + options */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* Mascot + speech bubble */}
              <div style={{ display: 'flex', gap: 14, padding: '18px 20px 10px', alignItems: 'flex-end' }}>
                <FoxMascot mood={mood} size={76}/>
                <div style={{
                  flex: 1, background: T.card2, borderRadius: '16px 16px 16px 4px',
                  padding: '12px 16px', border: `1px solid ${T.border}`,
                  animation: 'fadeSlideUp 0.4s ease-out',
                }}>
                  <p style={{ color: T.orange, fontSize: 11, fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {lesson.instruction}
                  </p>
                  <p style={{ color: T.text, fontWeight: 600, fontSize: 14, margin: 0, lineHeight: 1.4 }}>
                    {lesson.mascotSpeech}
                  </p>
                </div>
              </div>

              {/* Code block */}
              {lesson.codeLines && lesson.codeLines.length > 0 && (
                <div style={{ padding: '2px 20px 14px' }}>
                  <CodeBlock
                    lines={lesson.codeLines}
                    language={lesson.lang || lesson.language || lang}
                    output={confirmed ? lesson.codeOutput : undefined}
                    blankWord={lesson.blankWord}
                    showAnswer={confirmed && lesson.type === 'fill_blank'}
                  />
                </div>
              )}

              {/* Options */}
              <div style={{ padding: '0 20px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {lesson.options.map((opt, i) => (
                  <OptionBtn
                    key={i}
                    label={opt}
                    index={i}
                    selected={confirmed ? (lastCorrect === false ? null : lesson.correctOption) : null}
                    correctIdx={lesson.correctOption}
                    confirmed={confirmed}
                    onSelect={(idx) => {
                      if (!confirmed) {
                        // Single-tap select → auto confirm
                        setMood('neutral')
                        const correct = idx === lesson.correctOption
                        setConfirmed(true)
                        setLastCorrect(correct)
                        handleAnswer(correct, lesson.xp)
                      }
                    }}
                    disabled={confirmed}
                  />
                ))}
              </div>

              {/* Padding so content scrolls above feedback panel */}
              {confirmed && <div style={{ height: 180 }}/>}
            </div>

            {/* Check button (before answer) */}
            {!confirmed && (
              <div style={{
                position: 'sticky', bottom: 0, background: T.bg,
                borderTop: `1px solid ${T.border}`, padding: '14px 20px 20px',
              }}>
                <p style={{ color: T.muted, fontSize: 12, textAlign: 'center', margin: '0 0 10px' }}>
                  Tap an option to answer
                </p>
              </div>
            )}

            {/* Feedback panel (after answer) */}
            {confirmed && (
              <div ref={feedbackRef} style={{
                position: 'sticky', bottom: 0, background: T.bg,
                borderTop: `1px solid ${lastCorrect ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
                padding: '14px 20px 20px',
                animation: 'fadeSlideUp 0.3s ease-out',
              }}>
                {/* Result banner */}
                <div style={{
                  borderRadius: 12, padding: '11px 16px', marginBottom: 12,
                  background: lastCorrect ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.08)',
                  border: `1px solid ${lastCorrect ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
                }}>
                  <p style={{ fontWeight: 700, fontSize: 13.5, margin: '0 0 3px', color: lastCorrect ? T.green : T.red }}>
                    {lastCorrect ? '✅ Correct! Well done.' : '❌ Not quite right.'}
                  </p>
                  <p style={{ color: T.light, fontSize: 12.5, lineHeight: 1.55, margin: 0 }}>
                    <ExplainText text={lesson.explanation}/>
                  </p>
                </div>

                {/* Next button */}
                <button
                  onClick={handleNext}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                    cursor: 'pointer', fontWeight: 800, fontSize: 15,
                    background: lastCorrect
                      ? `linear-gradient(135deg, ${T.green}, #22C55E)`
                      : `linear-gradient(135deg, ${T.orange}, #F59E0B)`,
                    color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: lastCorrect ? '0 6px 24px rgba(52,211,153,0.3)' : '0 6px 24px rgba(255,122,0,0.3)',
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  {qIdx + 1 >= sessionSize ? '🏆 Finish Lesson' : 'Next Question'}
                  <ChevronRight size={17}/>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
