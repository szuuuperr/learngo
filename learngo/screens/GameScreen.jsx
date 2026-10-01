'use client'

import React, { useState } from 'react'
import { useGame } from '../context/GameContext'
import { languages, chapterTitles, lessonsByLang } from '../data/curriculum'
import { Zap, Gem, Key, Heart } from 'lucide-react'

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:     '#0A0F1E',
  nav:    '#0F172A',
  card:   '#111827',
  border: '#1A2640',
  muted:  '#4B5563',
}

// ─── Game HUD ─────────────────────────────────────────────────────────────────
function GameHUD({ lang }) {
  const { lives, maxLives, gems, keys } = useGame()
  const cfg = {
    python:     { bg:'rgba(74,222,128,0.08)', color:'#4ADE80', border:'rgba(74,222,128,0.2)', label:'PY' },
    javascript: { bg:'rgba(252,211,77,0.08)', color:'#FCD34D', border:'rgba(252,211,77,0.2)', label:'JS' },
    cpp:        { bg:'rgba(192,132,252,0.08)', color:'#C084FC', border:'rgba(192,132,252,0.2)', label:'C++' },
    dsa:        { bg:'rgba(52,211,153,0.08)', color:'#34D399', border:'rgba(52,211,153,0.2)', label:'DSA' },
  }
  const c = cfg[lang] || cfg.python

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:T.nav, borderBottom:`1px solid ${T.border}` }}>
      {/* Lang badge */}
      <div style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:10, padding:'5px 12px', fontWeight:800, fontSize:13, color:c.color, fontFamily:'"JetBrains Mono",monospace', letterSpacing:1 }}>
        {c.label}
      </div>
      {/* Stats */}
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        {/* Lives */}
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          {Array.from({ length: maxLives }).map((_,i) => (
            <div key={i} style={{ width:12, height:12, borderRadius:'50%', background: i < lives ? '#F87171' : 'rgba(248,113,113,0.2)', transition:'all 0.3s', boxShadow: i < lives ? '0 0 6px rgba(248,113,113,0.5)' : 'none' }}/>
          ))}
        </div>
        <div style={{ width:1, height:16, background:T.border }}/>
        {/* Gems */}
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <div style={{ width:10, height:10, background:'linear-gradient(135deg,#60A5FA,#818CF8)', borderRadius:2, transform:'rotate(45deg)' }}/>
          <span style={{ color:'#93C5FD', fontWeight:700, fontSize:14 }}>{gems.toLocaleString()}</span>
        </div>
        {/* Keys */}
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:13 }}>🔑</span>
          <span style={{ color:'#FCD34D', fontWeight:700, fontSize:14 }}>{keys}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Language selector pill ───────────────────────────────────────────────────
function LangPill({ lang, selected, onClick, done, total }) {
  const isActive = selected === lang.id
  const pct = Math.round((done / total) * 100)
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:7, padding:'7px 14px', borderRadius:99,
      border:'none', cursor:'pointer', fontWeight:700, fontSize:13, whiteSpace:'nowrap',
      transition:'all 0.25s',
      background: isActive ? lang.bgColor : 'rgba(255,255,255,0.04)',
      color: isActive ? 'white' : '#64748B',
      boxShadow: isActive ? `0 0 16px ${lang.color}40, inset 0 1px 0 rgba(255,255,255,0.15)` : 'none',
      transform: isActive ? 'translateY(-1px)' : 'none',
    }}>
      <span style={{ fontSize:16 }}>{lang.icon}</span>
      <span>{lang.label}</span>
      <span style={{ fontSize:11, opacity:0.75, marginLeft:1, fontFamily:'"JetBrains Mono",monospace' }}>
        {done}/{total}
      </span>
    </button>
  )
}

// ─── Chapter banner ───────────────────────────────────────────────────────────
function ChapterBanner({ lang, completedCount }) {
  const { getLangProgress } = useGame()
  const prog     = getLangProgress(lang)
  const chapters = chapterTitles[lang] || chapterTitles.python
  const chIdx    = Math.min(completedCount, chapters.length - 1)
  const meta = {
    python:     { from:'#166534', to:'#14532D', accent:'#4ADE80' },
    javascript: { from:'#713F12', to:'#451A03', accent:'#FCD34D' },
    cpp:        { from:'#4C1D95', to:'#2E1065', accent:'#C084FC' },
    dsa:        { from:'#065F46', to:'#022C22', accent:'#34D399' },
  }[lang] || { from:'#166534', to:'#14532D', accent:'#4ADE80' }

  return (
    <div style={{ margin:'12px 16px', borderRadius:20, padding:'16px 18px 14px', position:'relative', overflow:'hidden', background:`linear-gradient(135deg, ${meta.from}, ${meta.to})`, border:`1px solid ${meta.accent}30` }}>
      {/* Decorative circle */}
      <div style={{ position:'absolute', right:-20, top:'50%', transform:'translateY(-50%)', width:80, height:80, borderRadius:'50%', background:`${meta.accent}15`, border:`2px solid ${meta.accent}30` }}/>
      <div style={{ position:'absolute', right:4, top:'50%', transform:'translateY(-50%)', width:52, height:52, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ color:meta.accent, fontWeight:800, fontSize:15, fontFamily:'"JetBrains Mono",monospace' }}>{prog.pct}%</span>
      </div>
      <p style={{ color:`${meta.accent}90`, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:2, margin:'0 0 3px' }}>
        CHAPTER {chIdx + 1} / {chapters.length}
      </p>
      <p style={{ color:'white', fontWeight:800, fontSize:18, lineHeight:1.25, margin:0, paddingRight:72 }}>
        {chapters[chIdx]}
      </p>
      <div style={{ marginTop:10, height:4, background:'rgba(255,255,255,0.15)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${prog.pct}%`, background:meta.accent, borderRadius:99, transition:'width 0.7s cubic-bezier(0.22,1,0.36,1)', boxShadow:`0 0 8px ${meta.accent}80` }}/>
      </div>
    </div>
  )
}

// ─── Connector line between hexagon rows ──────────────────────────────────────
function ConnectorLine({ fromDir }) {
  return (
    <div style={{ height:24, display:'flex', alignItems:'center', justifyContent: fromDir === 'left' ? 'flex-end' : 'flex-start', padding:'0 48px', opacity:0.3 }}>
      <svg width={80} height={24} style={{ overflow:'visible' }}>
        <path d={fromDir === 'left' ? 'M 0 0 Q 40 24 80 24' : 'M 80 0 Q 40 24 0 24'} fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4,4"/>
      </svg>
    </div>
  )
}

// ─── Hexagon node ─────────────────────────────────────────────────────────────
function HexNode({ levelNum, status, title, xp, onClick, size = 68 }) {
  const w = size, h = Math.round(size * 0.866)
  const pts = [
    [w * 0.25, 0], [w * 0.75, 0], [w, h * 0.5],
    [w * 0.75, h], [w * 0.25, h], [0, h * 0.5],
  ].map(p => p.join(',')).join(' ')

  const S = {
    done: {
      fill: '#0D2010', stroke: '#22C55E', glow: '0 0 16px rgba(34,197,94,0.45)',
      icon: '✓', ic: '#22C55E', nc: '#4ADE80',
    },
    active: {
      fill: '#0A1E30', stroke: '#38BDF8', glow: '0 0 20px rgba(56,189,248,0.65)',
      icon: null, ic: '#38BDF8', nc: '#38BDF8', pulse: true,
    },
    locked: {
      fill: '#0C1322', stroke: '#1E2A3A', glow: 'none',
      icon: '🔒', ic: '#1E3A5F', nc: '#1F2937', lockSmall: true,
    },
    quiz: {
      fill: '#130A24', stroke: '#7C3AED', glow: '0 0 14px rgba(124,58,237,0.4)',
      icon: '?', ic: '#A78BFA', nc: '#A78BFA',
    },
    challenge: {
      fill: '#1A0A04', stroke: '#EA580C', glow: '0 0 14px rgba(234,88,12,0.4)',
      icon: '⚡', ic: '#FB923C', nc: '#FB923C',
    },
    trophy: {
      fill: '#1A1400', stroke: '#CA8A04', glow: '0 0 18px rgba(202,138,4,0.55)',
      icon: '🏆', ic: '#FCD34D', nc: '#FCD34D',
    },
  }

  const s = S[status] || S.locked
  const clickable = status === 'active' || status === 'done'

  return (
    <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <div
        onClick={() => clickable && onClick()}
        title={title}
        style={{
          cursor: clickable ? 'pointer' : 'default',
          filter: `drop-shadow(${s.glow})`,
          transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), filter 0.2s',
          animation: s.pulse ? 'hex-pulse 2.2s ease-in-out infinite' : 'none',
          display: 'inline-flex',
        }}
        onMouseEnter={e => { if (clickable) e.currentTarget.style.transform = 'scale(1.12) translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) translateY(0)' }}
      >
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {/* Shadow polygon */}
          <polygon
            points={pts}
            fill="rgba(0,0,0,0.35)"
            transform="translate(2,3)"
          />
          {/* Main hexagon */}
          <polygon points={pts} fill={s.fill} stroke={s.stroke} strokeWidth="2.5"/>
          {/* Top gloss */}
          {status !== 'locked' && (
            <polygon
              points={[
                [w*0.3, 2], [w*0.7, 2], [w*0.85, h*0.26],
                [w*0.7, h*0.32], [w*0.3, h*0.32], [w*0.15, h*0.26],
              ].map(p => p.join(',')).join(' ')}
              fill="rgba(255,255,255,0.06)"
            />
          )}
          {/* Icon / number */}
          {s.icon ? (
            <>
              <text
                x={w / 2} y={h / 2 + (s.lockSmall ? 3 : 5)}
                textAnchor="middle"
                fill={s.ic}
                fontSize={s.lockSmall ? 16 : s.icon.length > 1 ? 20 : 24}
                fontWeight="700"
                fontFamily="system-ui,sans-serif"
                style={{ userSelect:'none' }}
              >{s.icon}</text>
              {!s.lockSmall && status !== 'trophy' && (
                <text
                  x={w / 2} y={h - 5}
                  textAnchor="middle"
                  fill={s.nc}
                  fontSize="10"
                  fontFamily="system-ui"
                  opacity="0.7"
                  style={{ userSelect:'none' }}
                >{levelNum}</text>
              )}
            </>
          ) : (
            <text
              x={w / 2} y={h / 2 + 6}
              textAnchor="middle"
              fill={s.nc}
              fontSize="22"
              fontWeight="800"
              fontFamily='"Plus Jakarta Sans",system-ui'
              style={{ userSelect:'none' }}
            >{levelNum}</text>
          )}
          {/* Done checkmark ring */}
          {status === 'done' && (
            <circle cx={w - 10} cy={10} r={9} fill="#166534" stroke="#22C55E" strokeWidth="1.5"/>
          )}
        </svg>
      </div>
      {/* XP label for active */}
      {status === 'active' && (
        <div style={{
          background: 'rgba(56,189,248,0.12)', border:'1px solid rgba(56,189,248,0.3)',
          borderRadius:99, padding:'2px 9px', fontSize:10, color:'#38BDF8',
          fontWeight:700, fontFamily:'"JetBrains Mono",monospace',
          animation:'fadeIn 0.4s ease-out',
        }}>+{xp} XP</div>
      )}
      {/* Title tooltip on done */}
      {status === 'done' && (
        <div style={{ fontSize:9, color:'#22C55E', fontWeight:600, maxWidth:64, textAlign:'center', lineHeight:1.2, opacity:0.7 }}>
          {title.length > 10 ? title.slice(0,10)+'…' : title}
        </div>
      )}
    </div>
  )
}

// ─── Zigzag level map ─────────────────────────────────────────────────────────
function LevelMap({ lang, lessons, onPlay }) {
  const { isLevelDone } = useGame()
  const COLS = 3
  const firstActive = lessons.findIndex((_, i) => !isLevelDone(lang, i))

  return (
    <div style={{ padding:'4px 16px 100px' }}>
      <style>{`
        @keyframes hex-pulse {
          0%,100% { filter: drop-shadow(0 0 10px rgba(56,189,248,0.4)); }
          50%      { filter: drop-shadow(0 0 22px rgba(56,189,248,0.85)); }
        }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {Array.from({ length: Math.ceil(lessons.length / COLS) }).map((_, rowIdx) => {
        const row    = lessons.slice(rowIdx * COLS, rowIdx * COLS + COLS)
        const isEven = rowIdx % 2 === 0
        const disp   = isEven ? row : [...row].reverse()

        return (
          <React.Fragment key={rowIdx}>
            {rowIdx > 0 && <ConnectorLine fromDir={rowIdx % 2 === 0 ? 'right' : 'left'} />}
            <div style={{
              display:'flex',
              justifyContent: isEven ? 'flex-start' : 'flex-end',
              gap:10,
              paddingLeft:  isEven ? 24 : 0,
              paddingRight: isEven ? 0 : 24,
              marginBottom: 4,
            }}>
              {disp.map(lesson => {
                const i      = lesson.id - 1
                const done   = isLevelDone(lang, i)
                const active = i === firstActive
                let status   = done ? 'done' : active ? 'active' : 'locked'
                if (!done && !active) {
                  if (lesson.type === 'quiz')      status = 'quiz'
                  if (lesson.type === 'challenge') status = 'challenge'
                  if (lesson.id === 10)            status = 'trophy'
                }
                return (
                  <HexNode
                    key={lesson.id}
                    levelNum={lesson.id}
                    status={status}
                    title={lesson.title}
                    xp={lesson.xp}
                    onClick={() => onPlay(lang, i, lesson)}
                  />
                )
              })}
            </div>
          </React.Fragment>
        )
      })}

      {/* All done state */}
      {firstActive === -1 && lessons.length > 0 && (
        <div style={{ textAlign:'center', padding:'32px 20px', animation:'fadeIn 0.5s ease-out' }}>
          <div style={{ fontSize:52, marginBottom:12 }}>🎓</div>
          <p style={{ color:'#22C55E', fontWeight:800, fontSize:18, margin:'0 0 6px' }}>Language Mastered!</p>
          <p style={{ color:'#4B5563', fontSize:13, margin:0 }}>All levels complete. Choose another language to keep learning.</p>
        </div>
      )}
    </div>
  )
}

// ─── Main GameScreen ──────────────────────────────────────────────────────────
export default function GameScreen({ onStartLesson }) {
  const { activeLang, setActiveLang, getLangProgress } = useGame()
  const [selectedLang, setSelected] = useState(activeLang)
  const lessons = lessonsByLang[selectedLang] || []

  const handleLangChange = (id) => { setSelected(id); setActiveLang(id) }
  const handlePlay = (lang, idx, lesson) => {
    if (onStartLesson) onStartLesson({ lang, levelIndex: idx, title: lesson.title })
  }

  return (
    <div style={{ background:T.bg, minHeight:'100vh' }} className="animate-fade-in">
      {/* HUD */}
      <GameHUD lang={selectedLang}/>

      {/* Language selector */}
      <div style={{ display:'flex', gap:8, padding:'12px 16px 10px', overflowX:'auto' }} className="no-scrollbar">
        {languages.map(lang => (
          <LangPill
            key={lang.id}
            lang={lang}
            selected={selectedLang}
            onClick={() => handleLangChange(lang.id)}
            done={getLangProgress(lang.id).done}
            total={10}
          />
        ))}
      </div>

      {/* Chapter banner */}
      <ChapterBanner lang={selectedLang} completedCount={getLangProgress(selectedLang).done}/>

      {/* Level map */}
      <LevelMap lang={selectedLang} lessons={lessons} onPlay={handlePlay}/>
    </div>
  )
}
