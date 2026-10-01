'use client'

import React, { useState } from 'react'
import {
  Bell, Flame, Star, ChevronDown, LogOut, Settings,
  User, Trophy, X, CheckCircle, Zap,
} from 'lucide-react'
import { user, notifications } from '../data/mockData'
import { LearnGoIcon } from './LearnGoLogo'
import { useGame } from '../context/GameContext'

// Fox mascot SVG component
export function FoxMascot({ size = 32, animated = false }) {
  return (
    <div
      className={`inline-flex items-center justify-center ${animated ? 'animate-float' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        {/* Body */}
        <ellipse cx="32" cy="44" rx="14" ry="12" fill="#FF7A00"/>
        {/* Head */}
        <circle cx="32" cy="26" r="14" fill="#FF7A00"/>
        {/* Ears */}
        <polygon points="18,14 14,4 24,12" fill="#FF7A00"/>
        <polygon points="46,14 50,4 40,12" fill="#FF7A00"/>
        <polygon points="19,13 16,7 23,12" fill="#FFC080"/>
        <polygon points="45,13 48,7 41,12" fill="#FFC080"/>
        {/* Face white */}
        <ellipse cx="32" cy="29" rx="9" ry="8" fill="#FFF0E0"/>
        {/* Eyes */}
        <circle cx="27" cy="24" r="3" fill="#1E293B"/>
        <circle cx="37" cy="24" r="3" fill="#1E293B"/>
        <circle cx="28" cy="23" r="1" fill="white"/>
        <circle cx="38" cy="23" r="1" fill="white"/>
        {/* Nose */}
        <ellipse cx="32" cy="29" rx="2.5" ry="1.5" fill="#CC5500"/>
        {/* Smile */}
        <path d="M 28 32 Q 32 35 36 32" stroke="#CC5500" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        {/* Tail hint */}
        <path d="M 44 50 Q 56 46 52 56 Q 48 60 44 54" fill="#FF7A00"/>
        <path d="M 46 52 Q 54 49 51 56 Q 49 59 46 54" fill="#FFC080"/>
      </svg>
    </div>
  )
}

// Notification Drawer
function NotificationDrawer({ open, onClose }) {
  const [notifs, setNotifs] = useState(notifications)
  const unreadCount = notifs.filter(n => n.unread).length

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, unread: false })))

  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-14 w-80 glass-card rounded-2xl border border-white/10 z-50 shadow-card overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-orange" />
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-orange text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-slate hover:text-white transition-colors">
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="text-slate hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {notifs.map(n => (
            <div
              key={n.id}
              className={`px-4 py-3 border-b border-white/5 flex gap-3 cursor-pointer hover:bg-white/5 transition-colors ${n.unread ? 'bg-orange/5' : ''}`}
              onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, unread: false } : x))}
            >
              <div className="mt-0.5">
                {n.unread && <div className="w-2 h-2 bg-orange rounded-full" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{n.title}</p>
                <p className="text-xs text-slate mt-0.5 leading-relaxed">{n.message}</p>
                <p className="text-xs text-slate/60 mt-1">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// User profile dropdown
function ProfileDropdown({ open, onClose, onLogout, onSettings }) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-14 w-56 glass-card rounded-2xl border border-white/10 z-50 shadow-card overflow-hidden animate-slide-up">
        <div className="px-4 py-3 border-b border-white/10">
          <p className="font-semibold text-sm text-white">{user.name}</p>
          <p className="text-xs text-slate">{user.username}</p>
        </div>
        <div className="py-1">
          {[
            { icon: User,    label: 'Profile',       action: onClose },
            { icon: Trophy,  label: 'Achievements',  action: onClose },
            { icon: Settings, label: 'Settings',     action: onSettings },
          ].map(({ icon: Icon, label, action }) => (
            <button key={label} onClick={action}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate hover:text-white hover:bg-white/5 transition-colors text-left">
              <Icon size={15} /> {label}
            </button>
          ))}
          <div className="border-t border-white/10 mt-1 pt-1">
            <button onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left">
              <LogOut size={15} /> Log Out
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function Header({ onNavigate, onLogout, onSettings }) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const unreadCount = notifications.filter(n => n.unread).length
  const { xp, xpToNext, level, streak } = useGame()
  const xpPercent = Math.round((xp / xpToNext) * 100)

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-16 glass-card border-b border-white/10 px-4 lg:px-6">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-3">
        {/* Logo */}
        <button onClick={() => onNavigate('home')} className="flex items-center gap-2.5 flex-shrink-0">
          <LearnGoIcon size={34} />
          <span className="text-lg font-extrabold tracking-tight text-white hidden sm:block">
            Learn<span style={{ color: '#FF7A00' }}>Go</span>
          </span>
        </button>

        {/* Gamification bar — center */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-1 justify-center">
          {/* Streak */}
          <div className="flex items-center gap-1.5 glass-card px-2.5 py-1.5 rounded-xl border border-orange/20 hover:border-orange/40 transition-colors cursor-default">
            <Flame size={16} className="text-orange" />
            <span className="text-sm font-bold text-white">{streak}</span>
            <span className="text-xs text-slate hidden sm:block">days</span>
          </div>
          {/* XP */}
          <div className="flex items-center gap-1.5 glass-card px-2.5 py-1.5 rounded-xl border border-yellow-400/20 hover:border-yellow-400/40 transition-colors cursor-default">
            <Star size={16} className="text-yellow-400" />
            <span className="text-sm font-bold text-white">{xp}</span>
            <span className="text-xs text-slate hidden sm:block">XP</span>
          </div>
          {/* XP Progress */}
          <div className="hidden md:flex items-center gap-2 glass-card px-3 py-1.5 rounded-xl border border-white/10">
            <Zap size={14} className="text-cyan flex-shrink-0" />
            <div className="w-20 h-1.5 bg-navy rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan to-emerald rounded-full transition-all duration-700"
                style={{ width: `${xpPercent}%` }} />
            </div>
            <span className="text-xs text-slate">{xp}/{xpToNext}</span>
          </div>
        </div>

        {/* Right: Notif + Avatar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(o => !o); setProfileOpen(false) }}
              className="relative p-2 rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} className="text-slate hover:text-white transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-orange rounded-full text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="relative">
              <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>
          </div>

          {/* Avatar + level badge */}
          <div className="relative">
            <button
              onClick={() => { setProfileOpen(o => !o); setNotifOpen(false) }}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/10 transition-colors group"
              aria-label="Profile menu"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange to-orange-glow flex items-center justify-center text-sm font-bold text-white shadow-orange-glow/50">
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <span className="absolute -bottom-1 -right-1 bg-navy border-2 border-obsidian text-[9px] font-bold text-orange w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {level}
                </span>
              </div>
              <ChevronDown size={14} className="text-slate hidden sm:block group-hover:text-white transition-colors" />
            </button>
            <ProfileDropdown
              open={profileOpen}
              onClose={() => setProfileOpen(false)}
              onLogout={onLogout}
              onSettings={onSettings}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
