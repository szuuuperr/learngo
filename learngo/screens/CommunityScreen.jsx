'use client'

import React, { useState } from 'react'
import {
  Users, Briefcase, MessageCircle, Share2, Shield,
  ChevronRight, Eye, EyeOff, Globe, Lock, Star,
  ExternalLink, Linkedin, Github, Check,
} from 'lucide-react'
import { communityMembers, industrySkills, user } from '../data/mockData'

// ─── Peer Card ────────────────────────────────────────────────────────────────
function PeerCard({ member }) {
  const [connected, setConnected] = useState(false)

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-4 border border-white/10 flex items-center gap-3">
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan/40 to-emerald/40 border border-white/10 flex items-center justify-center text-sm font-bold text-white">
          {member.avatar}
        </div>
        {member.online && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald rounded-full border-2 border-obsidian" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{member.name}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate">Lv.{member.level}</span>
          <span className="text-xs text-slate/40">•</span>
          <span className="text-xs text-cyan font-medium">{member.specialty}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-1 text-xs text-yellow-400 font-semibold">
          <Star size={11} /> {member.xp}
        </div>
        <button
          onClick={() => setConnected(c => !c)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150
            ${connected
              ? 'bg-emerald/15 text-emerald border-emerald/30'
              : 'bg-navy-light border-white/10 text-white hover:border-cyan/30 hover:text-cyan'}`}>
          {connected ? <><Check size={11} className="inline mr-1" />Connected</> : 'Connect'}
        </button>
      </div>
    </div>
  )
}

// ─── Skill Bar ────────────────────────────────────────────────────────────────
const demandColors = {
  'Critical':  'bg-red-500/20 text-red-400 border-red-500/30',
  'High':      'bg-orange/15 text-orange-light border-orange/30',
  'Medium':    'bg-yellow-400/15 text-yellow-400 border-yellow-400/30',
  'Essential': 'bg-emerald/15 text-emerald border-emerald/30',
}

function SkillBar({ skill, isShared }) {
  const demandStyle = demandColors[skill.demand] || demandColors.Medium

  return (
    <div className="flex items-center gap-3">
      <span className="text-base w-6 flex-shrink-0 text-center">{skill.icon}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-white">{skill.skill}</span>
          <div className="flex items-center gap-2">
            <span className={`tag-pill text-xs border ${demandStyle}`}>{skill.demand}</span>
            <span className="text-xs text-slate">{skill.level}%</span>
          </div>
        </div>
        <div className="h-1.5 bg-navy rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${isShared ? 'opacity-100' : 'opacity-40'}`}
            style={{
              width: `${skill.level}%`,
              background: `linear-gradient(90deg, #06B6D4, #10B981)`,
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Community Screen ─────────────────────────────────────────────────────────
export default function CommunityScreen() {
  const [skillsShared, setSkillsShared] = useState(false)
  const [profileVisible, setProfileVisible] = useState(false)
  const [activeSection, setActiveSection] = useState('peers') // peers | industry

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Community Hub</h1>
        <p className="text-slate text-sm mt-0.5">Connect with peers, mentors, and industry partners</p>
      </div>

      {/* Toggle section */}
      <div className="flex glass-card rounded-xl border border-white/10 p-0.5 gap-0.5">
        {[
          { id: 'peers',    label: '👥 Peer Collaboration' },
          { id: 'industry', label: '🏢 Industry Bridge' },
        ].map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150
              ${activeSection === s.id ? 'bg-orange text-white' : 'text-slate hover:text-white'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Peers */}
      {activeSection === 'peers' && (
        <div className="space-y-4">
          {/* Study Room Banner */}
          <div className="glass-card rounded-2xl border border-cyan/25 p-4 bg-cyan/5 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex items-start gap-3">
              <div className="w-10 h-10 bg-cyan/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-cyan" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-sm">Study Rooms — Live Now</h3>
                <p className="text-xs text-slate mt-0.5">3 rooms open · 12 students studying</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Merge Sort Deep Dive 🔀', 'Python OOP Q&A 🐍', 'Graph Theory 📊'].map(room => (
                    <button key={room}
                      className="text-xs glass-card border border-cyan/25 hover:border-cyan/50 text-cyan px-2.5 py-1 rounded-lg transition-colors">
                      {room}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mentor Banner */}
          <div className="glass-card rounded-2xl border border-emerald/25 p-4 bg-emerald/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle size={20} className="text-emerald" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-sm">Mentorship Sessions</h3>
                <p className="text-xs text-slate">Next slot: Dr. Budi Santoso — Algorithms · Tomorrow 3PM</p>
              </div>
              <button className="btn-secondary text-xs flex-shrink-0">Book</button>
            </div>
          </div>

          {/* Peer list */}
          <div>
            <p className="text-sm font-semibold text-white mb-2">Peers Near Your Level</p>
            <div className="space-y-2">
              {communityMembers.map(m => <PeerCard key={m.id} member={m} />)}
            </div>
          </div>
        </div>
      )}

      {/* Industry Bridge */}
      {activeSection === 'industry' && (
        <div className="space-y-4">
          {/* Privacy toggle */}
          <div className="glass-card rounded-2xl border border-white/10 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange/15 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield size={20} className="text-orange" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-sm">Skill Tree Visibility</h3>
                <p className="text-xs text-slate mt-0.5 leading-relaxed">
                  Control whether partner companies can discover your skill profile. Your identity stays private — companies only see an anonymized skill map.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <button
                    onClick={() => setSkillsShared(s => !s)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200
                      ${skillsShared
                        ? 'bg-emerald/15 text-emerald border-emerald/30'
                        : 'bg-navy-light border-white/10 text-slate hover:text-white'}`}>
                    {skillsShared ? <Eye size={13} /> : <EyeOff size={13} />}
                    {skillsShared ? 'Visible to Partners' : 'Hidden from Partners'}
                  </button>
                  <button
                    onClick={() => setProfileVisible(v => !v)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200
                      ${profileVisible
                        ? 'bg-cyan/15 text-cyan border-cyan/30'
                        : 'bg-navy-light border-white/10 text-slate hover:text-white'}`}>
                    {profileVisible ? <Globe size={13} /> : <Lock size={13} />}
                    {profileVisible ? 'Internship Open' : 'Closed to Opportunities'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Skill Map */}
          <div className="glass-card rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Briefcase size={15} className="text-orange" /> Your Industry Skill Map
              </h3>
              {skillsShared && (
                <span className="text-xs text-emerald flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald rounded-full animate-pulse" />
                  Shared with 4 partners
                </span>
              )}
            </div>
            <div className="space-y-3.5">
              {industrySkills.map(s => <SkillBar key={s.skill} skill={s} isShared={skillsShared} />)}
            </div>
            {!skillsShared && (
              <p className="text-xs text-center text-slate/60 mt-3">Enable visibility to share with partner companies</p>
            )}
          </div>

          {/* Partner companies */}
          <div className="glass-card rounded-2xl border border-white/10 p-4">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Share2 size={15} className="text-cyan" /> Partner Companies
            </h3>
            <div className="space-y-2">
              {[
                { name: 'Tokopedia Engineering',  role: 'Backend Intern',    match: 84, logo: 'T' },
                { name: 'Gojek Tech',             role: 'SWE Intern',        match: 71, logo: 'G' },
                { name: 'Ruangguru R&D',          role: 'AI/ML Intern',      match: 68, logo: 'R' },
              ].map(c => (
                <div key={c.name} className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200
                  ${skillsShared ? 'border-white/10 hover:border-orange/25 cursor-pointer' : 'border-white/5 opacity-40 cursor-not-allowed'}`}>
                  <div className="w-9 h-9 rounded-xl bg-navy-light border border-white/10 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {c.logo}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    <p className="text-xs text-slate">{c.role}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-emerald">{c.match}%</p>
                    <p className="text-xs text-slate">match</p>
                  </div>
                  {skillsShared && <ChevronRight size={14} className="text-slate/50" />}
                </div>
              ))}
            </div>
            {!skillsShared && (
              <p className="text-xs text-center text-slate/50 mt-2">Enable skill visibility to see your match scores</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
