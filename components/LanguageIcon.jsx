'use client'

import React from 'react'

// Logo bahasa memakai <img> biasa dengan alasan yang sama seperti aset brand di
// components/LearnGoLogo.jsx. Semuanya SVG murni tanpa <text> atau raster
// tertanam, jadi tidak bergantung font dan tetap tajam di layar retina.

export const LANG_ASSETS = {
  python: '/images/python.svg',
  javascript: '/images/javascript.svg',
  cpp: '/images/cpp.svg',
  dsa: '/images/data.svg',
}

// Rasio tinggi/lebar tiap berkas. cpp.svg tidak punya viewBox hanya width dan
// height, jadi rasionya diambil dari sana; tanpa ini ikon C++ terkompresi karena
// <img> akan memakai rasio baku 1:1.
export const LANG_RATIO = {
  python: 1,
  javascript: 1,
  cpp: 344.35 / 306,
  dsa: 1,
}

// Ikon bahasa dengan lebar yang ditentukan. `size` selalu berarti lebar,
// supaya pemanggil tidak perlu tahu rasio masing-masing berkas.
export function LanguageIcon({ lang, size = 16, className, style }) {
  const src = LANG_ASSETS[lang]
  if (!src) return null

  const height = Math.round(size * (LANG_RATIO[lang] ?? 1))

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={height}
      className={className}
      style={{
        width: size,
        height,
        display: 'inline-block',
        flexShrink: 0,
        objectFit: 'contain',
        ...style,
      }}
    />
  )
}