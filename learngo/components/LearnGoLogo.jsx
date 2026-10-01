'use client'

import React from 'react'

// Full LearnGo brand logo — fox face rounded square + wordmark
// Matches the provided brand image exactly
export function LearnGoLogoFull({ size = 120 }) {
  return (
    <div className="flex flex-col items-center gap-2" style={{ width: size }}>
      {/* Fox face icon */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.22,
          background: 'linear-gradient(145deg, #E8650A, #CC5500)',
          boxShadow: '0 4px 20px rgba(204,85,0,0.5)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FoxFaceSVG size={size * 0.85} />
      </div>
      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: size * 0.28, color: '#1E2D6B', letterSpacing: '-0.5px' }}>Learn</span>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: size * 0.28, color: '#FF7A00', letterSpacing: '-0.5px' }}>Go</span>
        <span style={{ fontSize: size * 0.18, marginLeft: 2 }}>▶</span>
      </div>
    </div>
  )
}

// Small icon version (header / favicon)
export function LearnGoIcon({ size = 36 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: size * 0.22,
      background: 'linear-gradient(145deg, #FF7A00, #E8650A)',
      boxShadow: '0 0 12px rgba(255,122,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
    }}>
      <FoxFaceSVG size={size * 0.82} />
    </div>
  )
}

// Fox face SVG (reusable)
export function FoxFaceSVG({ size = 80 }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ears */}
      <polygon points="10,38 4,10 28,30" fill="#E8650A"/>
      <polygon points="90,38 96,10 72,30" fill="#E8650A"/>
      <polygon points="12,36 8,16 26,30" fill="#F5C08A"/>
      <polygon points="88,36 92,16 74,30" fill="#F5C08A"/>
      {/* Head */}
      <ellipse cx="50" cy="58" rx="38" ry="36" fill="#E8650A"/>
      {/* Forehead lighter */}
      <ellipse cx="50" cy="42" rx="30" ry="22" fill="#F07520"/>
      {/* Face cream */}
      <ellipse cx="50" cy="68" rx="26" ry="22" fill="#F5E0C0"/>
      {/* Eyes */}
      <ellipse cx="35" cy="52" rx="9" ry="11" fill="#2A2A3A"/>
      <ellipse cx="65" cy="52" rx="9" ry="11" fill="#2A2A3A"/>
      {/* Eye shine */}
      <ellipse cx="37" cy="49" rx="3" ry="3.5" fill="white"/>
      <ellipse cx="67" cy="49" rx="3" ry="3.5" fill="white"/>
      {/* Nose */}
      <ellipse cx="50" cy="68" rx="5" ry="4" fill="#9C4A10"/>
      <ellipse cx="50" cy="67" rx="3" ry="2" fill="#7A3A0C"/>
    </svg>
  )
}
