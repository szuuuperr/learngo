'use client'

import React from 'react'
import { useGame } from '../context/GameContext'
import { languages, chapterTitles, lessonsByLang } from '../data/curriculum'
import { Gem, Key, Trophy, Code2, Rocket, FileQuestion, Check } from 'lucide-react'
import { LanguageIcon } from '../components/LanguageIcon'
import { FoxMascot } from '../components/Header'

// Palet navy + oranye/cokelat solid. Sengaja tanpa glow/shadow supaya tampilan
// level map rata (flat) dan menyatu dengan latar.
const T = {
  bg:          '#212649',
  nav:         '#323868',
  card:        '#323868',
  border:      '#313668',
  orange:      '#FF7A00',
  orangeSoft:  '#FFB25E',
  brown:       '#8A4B12',
  brownStroke: '#C87A2E',
  muted:       '#8B8CA5',
  dim:         '#6B72A0',
}

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
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:T.nav, borderBottom:`1px solid ${T.border}`, borderTopLeftRadius:16, borderTopRightRadius:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:7, background:c.bg, border:`1px solid ${c.border}`, borderRadius:12, padding:'5px 12px', fontWeight:800, fontSize:13, color:c.color, letterSpacing:1 }}>
        <LanguageIcon lang={lang} size={15} />
        {c.label}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          {Array.from({ length: maxLives }).map((_,i) => (
            <div key={i} style={{ width:12, height:12, borderRadius:'50%', background: i < lives ? '#F87171' : 'rgba(248,113,113,0.2)', transition:'background 0.3s' }}/>
          ))}
        </div>
        <div style={{ width:1, height:16, background:T.border }}/>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <Gem size={14} style={{ color: '#7DD3FC' }} />
          <span style={{ color:'#7DD3FC', fontWeight:700, fontSize:14 }}>{gems.toLocaleString()}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <Key size={13} style={{ color: '#F0D080' }} />
          <span style={{ color:'#F0D080', fontWeight:700, fontSize:14 }}>{keys}</span>
        </div>
      </div>
    </div>
  )
}

function LangPill({ lang, selected, onClick, done, total }) {
  const isActive = selected === lang.id
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:7, padding:'7px 14px', borderRadius:99,
      border: isActive ? `1px solid ${T.orange}` : `1px solid ${T.border}`, cursor:'pointer', fontWeight:700, fontSize:13, whiteSpace:'nowrap',
      transition:'all 0.2s',
      background: isActive ? 'rgba(255,122,0,0.14)' : 'transparent',
      color: isActive ? '#FFFFFF' : T.muted,
    }}>
      <LanguageIcon lang={lang.id} size={16} />
      <span>{lang.label}</span>
      <span style={{ fontSize:11, opacity:0.75, marginLeft:1, fontFamily:'"JetBrains Mono",monospace' }}>
        {done}/{total}
      </span>
    </button>
  )
}

function ChapterBanner({ lang, completedCount }) {
  const { getLangProgress } = useGame()
  const prog     = getLangProgress(lang)
  const chapters = chapterTitles[lang] || chapterTitles.python
  const chIdx    = Math.min(completedCount, chapters.length - 1)

  return (
    <div style={{ margin:'12px 16px', borderRadius:20, padding:'16px 18px 14px', position:'relative', overflow:'hidden', background:T.orange }}>
      <div style={{ position:'absolute', right:-20, top:'50%', transform:'translateY(-50%)', width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.12)' }}/>
      <p style={{ color:'rgba(255,255,255,0.8)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:2, margin:'0 0 3px' }}>
        CHAPTER {chIdx + 1} / {chapters.length}
      </p>
      <p style={{ color:'#FFFFFF', fontWeight:800, fontSize:18, lineHeight:1.25, margin:0, paddingRight:60 }}>
        {chapters[chIdx]}
      </p>
      <div style={{ marginTop:10, height:4, background:'rgba(255,255,255,0.3)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${prog.pct}%`, background:'#FFFFFF', borderRadius:99, transition:'width 0.7s cubic-bezier(0.22,1,0.36,1)' }}/>
      </div>
    </div>
  )
}

// Ikon menggantikan angka supaya tipe tantangan/materi langsung terlihat:
// </> untuk latihan kode, roket untuk tantangan, tanda tanya untuk kuis, dan
// peti harta untuk level pamungkas.
function ChestIcon({ size = 26, color = '#FFE0B8' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5h18V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>
      <path d="M3 10.5A3.5 3.5 0 0 1 6.5 7h11A3.5 3.5 0 0 1 21 10.5"/>
      <path d="M12 7v13"/>
      <circle cx="12" cy="13.5" r="1.4"/>
    </svg>
  )
}

function LevelIcon({ type, color }) {
  if (type === 'trophy')                          return <ChestIcon color={color}/>
  if (type === 'challenge' || type === 'multi_choice') return <Rocket size={26} color={color} strokeWidth={2.2}/>
  if (type === 'quiz')                            return <FileQuestion size={26} color={color} strokeWidth={2.2}/>
  return <Code2 size={26} color={color} strokeWidth={2.2}/>
}

// Tiap status punya gradasi terang→gelap, bevel bawah, bayangan, dan kilau kaca
// di bagian atas supaya terlihat timbul. Ikon diberi drop-shadow agar terangkat
// dari permukaan.
const HEX = {
  done:   { top:'#C67A2E', bottom:'#6E3A0C', bevel:'#4E2908', stroke:'#E0A661', icon:'#FFF1DC' },
  active: { top:'#FFB25E', bottom:'#E06300', bevel:'#9E4400', stroke:'#FFD9A8', icon:'#FFFFFF' },
  locked: { top:'#343B68', bottom:'#232A4E', bevel:'#1A1F40', stroke:'#414878', icon:'#6B72A0', opacity:0.6 },
}

function HexNode({ status, type, title, xp, onClick, size = 64 }) {
  const uid = React.useId().replace(/:/g, '')
  const w = size, h = Math.round(size * 0.866)
  const pts = [
    [w * 0.25, 0], [w * 0.75, 0], [w, h * 0.5],
    [w * 0.75, h], [w * 0.25, h], [0, h * 0.5],
  ].map(p => p.join(',')).join(' ')

  const s = HEX[status] || HEX.locked
  const clickable = status !== 'locked'

  return (
    <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <div
        onClick={() => clickable && onClick()}
        title={title}
        style={{
          position: 'relative', width: w, height: h + 10, display: 'inline-flex',
          cursor: clickable ? 'pointer' : 'default',
          opacity: s.opacity ?? 1,
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={e => { if (clickable) e.currentTarget.style.transform = 'perspective(320px) rotateX(12deg) translateY(-2px) scale(1.06)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
      >
        <svg width={w} height={h + 10} viewBox={`0 0 ${w} ${h + 10}`} style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={s.top}/>
              <stop offset="1" stopColor={s.bottom}/>
            </linearGradient>
            <linearGradient id={`gl-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.45"/>
              <stop offset="1" stopColor="#FFFFFF" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id={`ao-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#000000" stopOpacity="0.3"/>
              <stop offset="1" stopColor="#000000" stopOpacity="0"/>
            </linearGradient>
            <filter id={`blur-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3"/>
            </filter>
            <clipPath id={`clip-${uid}`}>
              <polygon points={pts}/>
            </clipPath>
          </defs>

          <polygon points={pts} fill="#000000" opacity="0.38" transform="translate(0,9)" filter={`url(#blur-${uid})`}/>
          {/* Deep side: dark base + mid bevel untuk kesan "jurang" yang dalam */}
          <polygon points={pts} fill="#120800" opacity="0.55" transform="translate(0,7)"/>
          <polygon points={pts} fill={s.bevel} transform="translate(0,3.5)"/>
          <polygon points={pts} fill={`url(#g-${uid})`} stroke={s.stroke} strokeWidth="1.5"/>
          <g clipPath={`url(#clip-${uid})`}>
            <rect x="0" y={h * 0.4} width={w} height={h * 0.6} fill={`url(#gl-${uid})`}/>
            <rect x="0" y="0" width={w} height={h * 0.22} fill={`url(#ao-${uid})`}/>
            <polyline
              points={`${w * 0.27},${h * 0.14} ${w * 0.73},${h * 0.14}`}
              fill="none" stroke="#FFFFFF" strokeOpacity="0.28" strokeWidth="2" strokeLinecap="round"
            />
          </g>
        </svg>

        {/* Icon lifted off the surface */}
        <div style={{
          position:'absolute', left:0, top:0, width:w, height:h,
          display:'flex', alignItems:'center', justifyContent:'center',
          filter:'drop-shadow(0 1.5px 1px rgba(0,0,0,0.55))',
        }}>
          <LevelIcon type={type} color={s.icon}/>
        </div>

        {status === 'done' && (
          <span style={{ position:'absolute', right:-4, top:-4, width:20, height:20, borderRadius:'50%', background:'#2E7D32', border:`2px solid ${T.brown}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Check size={11} color="#FFFFFF" strokeWidth={3}/>
          </span>
        )}
      </div>

      {status === 'active' && (
        <div style={{
          background:'rgba(255,122,0,0.14)', border:`1px solid rgba(255,122,0,0.35)`,
          borderRadius:99, padding:'2px 9px', fontSize:10, color:T.orangeSoft,
          fontWeight:700, fontFamily:'"JetBrains Mono",monospace',
        }}>+{xp} XP</div>
      )}
      {status === 'done' && (
        <div style={{ fontSize:9, color:T.brownStroke, fontWeight:600, maxWidth:64, textAlign:'center', lineHeight:1.2 }}>
          {title.length > 10 ? title.slice(0,10)+'…' : title}
        </div>
      )}
    </div>
  )
}

// Lebar jalur dan amplitudo liku menyesuaikan lebar viewport: di desktop
// geserannya lebih besar, di mobile tetap rapi di dalam layar.
function useViewportWidth() {
  const [vw, setVw] = React.useState(1024)
  React.useEffect(() => {
    const update = () => setVw(window.innerWidth)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return vw
}

function pathMetrics(vw) {
  if (vw >= 1280) return { contentW: 720, step: 86 }
  if (vw >= 1024) return { contentW: 640, step: 72 }
  if (vw >= 768)  return { contentW: 520, step: 56 }
  if (vw >= 640)  return { contentW: 440, step: 44 }
  return { contentW: Math.min(320, vw - 40), step: 32 }
}

function HexTile({ size = 44 }) {
  const uid = React.useId().replace(/:/g, '')
  const w = size, h = Math.round(size * 0.866)
  const pts = [
    [w * 0.25, 0], [w * 0.75, 0], [w, h * 0.5],
    [w * 0.75, h], [w * 0.25, h], [0, h * 0.5],
  ].map(p => p.join(',')).join(' ')

  return (
    <svg width={w} height={h + 8} viewBox={`0 0 ${w} ${h + 8}`} style={{ display:'block', overflow:'visible' }}>
      <defs>
        <linearGradient id={`tg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFB25E"/>
          <stop offset="1" stopColor="#E06300"/>
        </linearGradient>
      </defs>
      <polygon points={pts} fill="#000000" opacity="0.4" transform="translate(0,6)"/>
      <polygon points={pts} fill="#120800" opacity="0.55" transform="translate(0,5)"/>
      <polygon points={pts} fill="#9E4400" transform="translate(0,2.5)"/>
      <polygon points={pts} fill={`url(#tg-${uid})`} stroke="#FFD9A8" strokeWidth="1.2"/>
    </svg>
  )
}

function FoxOnHex({ foxSize = 48, tileSize = 44 }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', lineHeight:0 }}>
      {/* margin negatif membuat rubah menapak di atas segienam */}
      <div style={{ marginBottom: -tileSize * 0.34, zIndex: 1 }}>
        <FoxMascot size={foxSize} animated/>
      </div>
      <HexTile size={tileSize}/>
    </div>
  )
}

// Nodes ditumpuk ke bawah (flex column). Seluruh jalur ditaruh di container
// berlebar adaptif yang di-center (margin auto), lalu tiap node digeser
// kiri/kanan mengikuti gelombang sehingga alur berliku tetap simetris.
const WAVE = [0, 1, 2, 1, 0, -1, -2, -1]
const NODE_SIZE = 64

function LevelMap({ lang, lessons, onPlay }) {
  const { isLevelDone } = useGame()
  const vw = useViewportWidth()
  const { contentW, step } = pathMetrics(vw)
  const firstActive = lessons.findIndex((_, i) => !isLevelDone(lang, i))

  // Titik tengah horizontal node ke-i relatif ke container yang sudah di-center.
  const nodeX = (i) => contentW / 2 + WAVE[i % WAVE.length] * step

  // Hanya satu maskot, dan posisinya mengikuti chapter yang sedang berjalan.
  const foxIndex = firstActive !== -1 ? firstActive : lessons.length - 1

  return (
    <div style={{ padding:'8px 16px 110px' }}>
      <div style={{ width: contentW, margin:'0 auto', display:'flex', flexDirection:'column' }}>
        {lessons.map((lesson, i) => {
          const done   = isLevelDone(lang, i)
          const active = i === firstActive
          const status = done ? 'done' : active ? 'active' : 'locked'
          const type   = lesson.id === 10 ? 'trophy' : (lesson.type || 'lesson')
          const dir    = WAVE[i % WAVE.length]

          return (
            <React.Fragment key={lesson.id}>
              {i > 0 && (
                <svg width={contentW} height="30" style={{ display:'block' }}>
                  <path
                    d={`M ${nodeX(i - 1)} 0 C ${nodeX(i - 1)} 16, ${nodeX(i)} 14, ${nodeX(i)} 30`}
                    fill="none" stroke="#3A4070" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round"
                  />
                </svg>
              )}

              <div style={{ position:'relative', display:'flex', justifyContent:'center', marginBottom: 2 }}>
                <div style={{ transform:`translateX(${dir * step}px)` }}>
                  <HexNode
                    status={status}
                    type={type}
                    title={lesson.title}
                    xp={lesson.xp}
                    onClick={() => onPlay(lang, i, lesson)}
                  />
                </div>
                {i === foxIndex && (
                  <div style={{ position:'absolute', left: nodeX(i) + NODE_SIZE / 2 + 20, bottom: 0 }}>
                    <FoxOnHex/>
                  </div>
                )}
              </div>
            </React.Fragment>
          )
        })}
      </div>

      {firstActive === -1 && lessons.length > 0 && (
        <div style={{ textAlign:'center', padding:'32px 20px' }}>
          <Trophy size={40} style={{ color: T.brownStroke, marginBottom: 12 }} />
          <p style={{ color:'#FFFFFF', fontWeight:800, fontSize:18, margin:'0 0 6px' }}>Language Mastered!</p>
          <p style={{ color:T.muted, fontSize:13, margin:0 }}>All levels complete. Choose another language to keep learning.</p>
        </div>
      )}
    </div>
  )
}

export default function GameScreen({ onStartLesson }) {
  const { activeLang, setActiveLang, getLangProgress } = useGame()
  const [selectedLang, setSelected] = React.useState(activeLang)
  const lessons = lessonsByLang[selectedLang] || []

  const handleLangChange = (id) => { setSelected(id); setActiveLang(id) }
  const handlePlay = (lang, idx, lesson) => {
    if (onStartLesson) onStartLesson({ lang, levelIndex: idx, title: lesson.title })
  }

  return (
    <div style={{ background:T.bg, minHeight:'100vh', borderRadius:16, overflow:'hidden' }} className="animate-fade-in">
      <GameHUD lang={selectedLang}/>

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

      <ChapterBanner lang={selectedLang} completedCount={getLangProgress(selectedLang).done}/>

      <LevelMap lang={selectedLang} lessons={lessons} onPlay={handlePlay}/>
    </div>
  )
}
