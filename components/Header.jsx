'use client'

import React from 'react'
import { BRAND_ASSETS, BRAND_RATIO } from './LearnGoLogo'

// Mascot: satu SVG statis, jadi animasi lewat kelas CSS, bukan gambar berbeda.
export function FoxMascot({ size = 32, animated = false }) {
  const height = Math.round(size * BRAND_RATIO.mascot)

  return (
    <div
      className={`inline-flex items-center justify-center ${animated ? 'animate-float' : ''}`}
      style={{ width: size, height }}
    >
      <img
        src={BRAND_ASSETS.mascot}
        alt="LearnGo mascot"
        width={size}
        height={height}
        style={{ width: size, height, display: 'block' }}
      />
    </div>
  )
}
