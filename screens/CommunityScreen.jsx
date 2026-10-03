'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import {
  Users, Briefcase, MessageCircle, MessageSquare, Share2, Shield,
  ChevronRight, Eye, EyeOff, Globe, Lock, Star, Loader2, Building2,
} from 'lucide-react'
import { useCatalog } from '../lib/useCatalog'
import { useLeaderboard } from '../lib/useLeaderboard'
import { LanguageIcon } from '../components/LanguageIcon'
import ChatPanel from './ChatPanel'

// Barisnya berasal dari get_leaderboard(), jadi field yang tersedia hanya nama,
// avatar, level, XP, dan streak. Tidak ada specialties atau status online
// di database, jadi tidak ditampilkan.
function PeerCard({ member }) {
  return (
    <div className="glass-card glass-card-hover rounded-2xl p-4 border border-white/10 flex items-center gap-3">
      <div className="relative flex-shrink-0">
        {member.avatarUrl ? (
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/10">
            <Image src={member.avatarUrl} alt="" fill sizes="40px" unoptimized className="object-cover" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-cyan/20 border border-cyan/30 flex items-center justify-center text-sm font-bold text-white">
            {member.name.charAt(0).toUpperCase()}
          </div>
        )}
        {member.isMe && (
          <div className="absolute -bottom-0.5 -right-0.5 px-1 rounded-full bg-orange text-white text-[9px] font-bold border-2 border-obsidian">
            You
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{member.name}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate">Lv.{member.level}</span>
          {member.streak > 0 && (
            <>
              <span className="text-xs text-slate/40">•</span>
              <span className="text-xs text-orange font-medium">{member.streak} day streak</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs text-yellow-400 font-semibold flex-shrink-0">
        <Star size={11} /> {member.xp.toLocaleString('id-ID')}
      </div>
    </div>
  )
}

function formatSlot(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

const demandColors = {
  'Critical':  'bg-red-500/20 text-red-400 border-red-500/30',
  'High':      'bg-orange/15 text-orange-light border-orange/30',
  'Medium':    'bg-yellow-400/15 text-yellow-400 border-yellow-400/30',
  'Essential': 'bg-emerald/15 text-emerald border-emerald/30',
}

// Angka yang ditampilkan adalah persentase permintaan dari tabel industry_skills,
// bukan proficiency user. Label sengaja menyebut demand supaya tidak disalahbaca
// sebagai kemajuan belajar.
// Kolom icon di industry_skills masih berisi emoji dan cakupannya lebih luas dari
// empat jalur belajar: React, SQL, TypeScript, Docker, System Design, dan Git tidak
// punya logo di public/images. Tambah ke SKILL_LOGO_SLUG kalau aset lain menyusul.
const SKILL_LOGO_SLUG = {
  Python: 'python',
  JavaScript: 'javascript',
}

function SkillBar({ skill, isShared }) {
  const demandStyle = demandColors[skill.demand] || demandColors.Medium
  const pct = Number.isFinite(skill.demand_pct) ? skill.demand_pct : 0
  const logoSlug = SKILL_LOGO_SLUG[skill.skill]

  return (
    <div className="flex items-center gap-3">
      {logoSlug ? (
        <LanguageIcon lang={logoSlug} size={16} />
      ) : (
        <span className="text-base w-6 flex-shrink-0 text-center">{skill.icon}</span>
      )}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-white">{skill.skill}</span>
          <div className="flex items-center gap-2">
            <span className={`tag-pill text-xs border ${demandStyle}`}>{skill.demand}</span>
            <span className="text-xs text-slate">{pct}% demand</span>
          </div>
        </div>
        <div className="h-1.5 bg-raised rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${isShared ? 'opacity-100' : 'opacity-40'}`}
            style={{
              width: `${pct}%`,
              background: '#06B6D4',
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default function CommunityScreen() {
  const [skillsShared, setSkillsShared] = useState(false)
  const [profileVisible, setProfileVisible] = useState(false)
  const [activeSection, setActiveSection] = useState('peers')

  // Data dibaca dari tabel pada migration 0004, dan tiap section punya empty state
  // supaya "tidak ada data" tidak pernah terlihat seperti "nol".
  const { studyRooms, mentors, industrySkills, partners } = useCatalog()
  const { entries: peers, loading: peersLoading } = useLeaderboard(8)

  const openRooms = studyRooms.filter(r => r.is_open)

  // Mentor berikutnya diambil dari baris yang memang punya slot masa depan, jadi
  // kartu ini tidak pernah menyebut nama orang yang tidak punya jadwal.
  const nextMentor = mentors
    .filter(m => m.is_available && m.next_slot)
    .sort((a, b) => new Date(a.next_slot) - new Date(b.next_slot))[0]

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Community Hub</h1>
        <p className="text-slate text-sm mt-0.5">Connect with peers, mentors, and industry partners</p>
      </div>

      {/* Tiga tombol dibagi rata lewat grid supaya padding-x tiap tombol seragam dan
          tidak ada label yang menempel ke tepi container. Di bawah `sm` label penuh
          tidak muat dalam tiga kolom, jadi tiap tombol memakai bentuk pendek. */}
      <div className="grid grid-cols-3 gap-1 bg-obsidian rounded-xl border border-indigo p-1">
        {[
          { id: 'peers',    label: 'Peer Collaboration', short: 'Peers',    Icon: Users },
          { id: 'chat',     label: 'Live Chat',         short: 'Chat',     Icon: MessageSquare },
          { id: 'industry', label: 'Industry Bridge',   short: 'Industry', Icon: Building2 },
        ].map(({ id, label, short, Icon }) => (
          <button key={id} onClick={() => setActiveSection(id)}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 min-w-0
              ${activeSection === id ? 'bg-orange text-white' : 'text-slate hover:text-white'}`}>
            <Icon size={13} className="flex-shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{label}</span>
            </span>
          </button>
        ))}
      </div>

      {activeSection === 'chat' && <ChatPanel />}

      {activeSection === 'peers' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl border border-cyan/25 p-4 bg-cyan/5 relative overflow-hidden">
            <div className="relative flex items-start gap-3">
              <div className="w-10 h-10 bg-cyan/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-cyan" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-sm">
                  Study Rooms
                  {openRooms.length > 0 && <span className="text-cyan ml-1.5">Live Now</span>}
                </h3>
                <p className="text-xs text-slate mt-0.5">
                  {studyRooms.length === 0
                    ? 'No rooms scheduled yet'
                    : `${openRooms.length} of ${studyRooms.length} rooms open`}
                </p>
                {studyRooms.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {studyRooms.map(room => (
                      <span
                        key={room.id}
                        className={`text-xs border px-2.5 py-1 rounded-lg transition-colors
                          ${room.is_open
                            ? 'glass-card border-cyan/25 text-cyan'
                            : 'bg-raised border-white/10 text-slate'}`}
                      >
                        {room.title}
                        {room.is_open ? '' : ' · closed'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-emerald/25 p-4 bg-emerald/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle size={20} className="text-emerald" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-sm">Mentorship Sessions</h3>
                {nextMentor ? (
                  <p className="text-xs text-slate">
                    Next slot: {nextMentor.name} · {nextMentor.expertise} · {formatSlot(nextMentor.next_slot)}
                  </p>
                ) : (
                  <p className="text-xs text-slate">No mentorship slots open right now</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white mb-2">Top Learners</p>
            {peersLoading ? (
              <div className="flex items-center gap-2 py-6 justify-center text-slate">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">Loading learners…</span>
              </div>
            ) : peers.length === 0 ? (
              <div className="glass-card rounded-2xl border border-white/10 p-6 text-center">
                <Users size={20} className="text-slate/40 mx-auto mb-2" />
                <p className="text-xs text-slate">
                  No learners to rank yet. Complete a lesson to appear on the leaderboard.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {peers.map(m => <PeerCard key={m.id} member={m} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSection === 'industry' && (
        <div className="space-y-4">
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
                        : 'bg-raised border-white/10 text-slate hover:text-white'}`}>
                    {skillsShared ? <Eye size={13} /> : <EyeOff size={13} />}
                    {skillsShared ? 'Visible to Partners' : 'Hidden from Partners'}
                  </button>
                  <button
                    onClick={() => setProfileVisible(v => !v)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200
                      ${profileVisible
                        ? 'bg-cyan/15 text-cyan border-cyan/30'
                        : 'bg-raised border-white/10 text-slate hover:text-white'}`}>
                    {profileVisible ? <Globe size={13} /> : <Lock size={13} />}
                    {profileVisible ? 'Internship Open' : 'Closed to Opportunities'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Briefcase size={15} className="text-orange" /> Your Industry Skill Map
              </h3>
              {skillsShared && partners.length > 0 && (
                <span className="text-xs text-emerald flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald rounded-full animate-pulse" />
                  Shared with {partners.length} partners
                </span>
              )}
            </div>
            {industrySkills.length === 0 ? (
              <p className="text-xs text-center text-slate/60 py-3">
                No skill data available yet
              </p>
            ) : (
              <div className="space-y-3.5">
                {industrySkills.map(s => <SkillBar key={s.skill} skill={s} isShared={skillsShared} />)}
              </div>
            )}
            {!skillsShared && (
              <p className="text-xs text-center text-slate/60 mt-3">Enable visibility to share with partner companies</p>
            )}
          </div>

          <div className="glass-card rounded-2xl border border-white/10 p-4">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Share2 size={15} className="text-cyan" /> Partner Companies
            </h3>
            <div className="space-y-2">
              {partners.length === 0 ? (
                <p className="text-xs text-center text-slate/60 py-3">
                  No partner companies listed yet
                </p>
              ) : partners.map(c => (
                <a
                  key={c.id}
                  href={c.website || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-disabled={!skillsShared}
                  onClick={e => { if (!skillsShared) e.preventDefault() }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200
                    ${skillsShared
                      ? 'border-white/10 hover:border-orange/25'
                      : 'border-white/5 opacity-40 pointer-events-none'}`}
                >
                  <div className="w-9 h-9 rounded-xl bg-raised border border-white/10 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    <p className="text-xs text-slate">Open positions</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-emerald">{c.match_pct}%</p>
                    <p className="text-xs text-slate">match</p>
                  </div>
                  {skillsShared && <ChevronRight size={14} className="text-slate/50" />}
                </a>
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
