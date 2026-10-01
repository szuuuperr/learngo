'use client'

import React, { useState } from 'react'
import { X, Eye, EyeOff, Mail, Lock, User, Loader, ArrowRight, LogOut } from 'lucide-react'
import { FoxMascot } from './Header'

// ─── Input Field ──────────────────────────────────────────────────────────────
function AuthInput({ icon: Icon, placeholder, type = 'text', value, onChange, toggleable }) {
  const [show, setShow] = useState(false)
  const inputType = toggleable ? (show ? 'text' : 'password') : type

  return (
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-DEFAULT">
        <Icon size={16} />
      </div>
      <input
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="input-dark w-full pl-10 pr-10"
      />
      {toggleable && (
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-DEFAULT hover:text-white transition-colors"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      )}
    </div>
  )
}

// ─── Auth Modal (Login + Register) ────────────────────────────────────────────
export function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode]       = useState('login')  // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({ name: '', email: '', password: '' })

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onSuccess()
    }, 1600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md glass-card rounded-3xl border border-white/10 overflow-hidden shadow-card animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-DEFAULT rounded-xl flex items-center justify-center shadow-orange-glow">
              <FoxMascot size={22} />
            </div>
            <div>
              <span className="font-extrabold text-white text-lg">Learn<span className="text-orange-DEFAULT">Go</span></span>
              <p className="text-xs text-slate-DEFAULT leading-none mt-0.5">AI Companion for CS</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-DEFAULT hover:text-white transition-colors p-1.5 rounded-xl hover:bg-white/8">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6">
          {/* Mode switcher */}
          <div className="flex glass-card rounded-xl border border-white/8 p-0.5 gap-0.5 mb-6">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-150
                  ${mode === m ? 'bg-orange-DEFAULT text-white' : 'text-slate-DEFAULT hover:text-white'}`}>
                {m === 'login' ? '🔑 Sign In' : '🚀 Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <AuthInput icon={User} placeholder="Full Name" value={form.name} onChange={set('name')} />
            )}
            <AuthInput icon={Mail} type="email" placeholder="Email address" value={form.email} onChange={set('email')} />
            <AuthInput icon={Lock} placeholder="Password" value={form.password} onChange={set('password')} toggleable />

            {mode === 'login' && (
              <div className="text-right">
                <button type="button" className="text-xs text-orange-DEFAULT hover:text-orange-glow transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !form.email || !form.password}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader size={16} className="animate-spin" /> Authenticating…</>
              ) : (
                <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={14} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-slate-DEFAULT">or continue with</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Social login placeholders */}
          <div className="grid grid-cols-2 gap-2">
            {['🔵 Google', '⚫ GitHub'].map(provider => (
              <button key={provider}
                className="btn-secondary py-2.5 flex items-center justify-center gap-2">
                <span className="text-xs font-semibold">{provider}</span>
              </button>
            ))}
          </div>

          <p className="text-xs text-center text-slate-DEFAULT mt-5 leading-relaxed">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-orange-DEFAULT hover:text-orange-glow font-semibold transition-colors">
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Logout Confirm Modal ─────────────────────────────────────────────────────
export function LogoutModal({ onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm glass-card rounded-3xl border border-white/10 overflow-hidden shadow-card animate-slide-up">
        <div className="px-6 py-6 text-center">
          <div className="w-14 h-14 mx-auto bg-red-500/15 rounded-2xl flex items-center justify-center mb-4">
            <LogOut size={26} className="text-red-400" />
          </div>
          <h3 className="text-lg font-extrabold text-white mb-1">Log Out?</h3>
          <p className="text-sm text-slate-DEFAULT leading-relaxed">
            Your streak and progress are saved. You can sign back in anytime.
          </p>
          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="btn-secondary flex-1 py-3">Cancel</button>
            <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold text-sm border border-red-500/30 transition-all duration-150">
              Yes, Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
