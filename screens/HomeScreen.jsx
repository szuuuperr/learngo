"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Play,
  ChevronRight,
  Brain,
  Zap,
  Flame,
  Star,
  X,
  Check,
  Gamepad2,
  BookOpen,
  Bot,
  Users,
  Shield,
  Code2,
  Shuffle,
  Database,
  MessageSquare,
  Trophy,
} from "lucide-react";
import {
  LearnGoIcon,
  FoxFaceSVG,
  BRAND_ASSETS,
  BRAND_RATIO,
} from "../components/LearnGoLogo";
import { useGame } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";
import { useCatalog } from "../lib/useCatalog";
import { languages, lessonsByLang, chapterTitles } from "../data/curriculum";

function formatNotifTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

// Nilai warna diambil dari kelas Illustrator di public/learngo/Mockup*.svg:
// .st0 canvas, .st13 isi kartu, .st3 pill, .st4 kartu hero, .st33 border,
// .st1 oranye utama, .st17 teks sekunder.
const T = {
  bg: "#212649", // .st0  canvas halaman
  card: "#323868", // .st13 isi kartu
  raised: "#212649", // .st3  pill & kotak ikon
  hero: "#323868", // .st4  kartu hero / progres harian
  border: "#313668", // .st33 garis pemisah
  orange: "#FF7A00", // .st1  aksen utama
  glow: "#F98B30", // .st18 hover oranye
  cream: "#FFF0D5", // .st15 teks di atas oranye
  muted: "#8B8CA5", // teks sekunder
  dim: "#6B72A0", // teks tersier (timestamp, milestone belum tercapai)
  danger: "#EA1B1B", // .st5  titik notifikasi
};

// Mascot brand dirender lewat <img> biasa, bukan next/image: next/image
// menolak SVG dari public/ kecuali dangerouslyAllowSVG diaktifkan di
// next.config.js, dan aset vektor tidak butuh pipeline optimasi gambar.
const mascotH = (size) => Math.round(size * BRAND_RATIO.mascot);

// Ukurannya mengikuti rasio viewBox yang tercatat di berkas SVG mascot.
function FloatingFox({ size = 72, animated = false }) {
  const height = mascotH(size);

  return (
    <div
      style={{
        animation: animated ? "float 3s ease-in-out infinite" : undefined,
        display: "inline-flex",
        flexShrink: 0,
        width: size,
        height,
      }}
    >
      <img
        src={BRAND_ASSETS.mascot}
        alt="LearnGo mascot"
        width={size}
        height={height}
        style={{ width: size, height, display: "block" }}
      />
    </div>
  );
}

// Notifikasi dibaca dari tabel `notifications`, sama dengan drawer di Header.
// Dua drawer ini sengaja berbagi sumber data supaya menandai satu notifikasi di
// salah satunya langsung terlihat efeknya di yang lain.
function NotifDrawer({ open, onClose, anchorRef }) {
  const { notifications, markRead, loading } = useCatalog();
  const { user } = useAuth();
  // Drawer memakai position fixed supaya tidak ikut terpotong overflow:hidden
  // pada header orange. Posisinya ditulis langsung ke DOM dari titik tombol bell.
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const el = anchorRef?.current;
      const panel = panelRef.current;
      if (!el || !panel) return;
      const r = el.getBoundingClientRect();
      const w = panel.offsetWidth || 300;
      const left = Math.min(
        Math.max(12, r.right - w),
        window.innerWidth - w - 12,
      );
      panel.style.left = `${left}px`;
      panel.style.top = `${r.bottom + 10}px`;
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef]);

  if (!open) return null;

  const userId = user?.id ?? "";
  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 40 }}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          left: -9999,
          top: -9999,
          width: 300,
          maxWidth: "calc(100vw - 24px)",
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 20,
          zIndex: 50,
          overflow: "hidden",
          animation: "slideDown 0.2s ease-out",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>
            Notifications
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: T.muted,
            }}
          >
            <X size={16} />
          </button>
        </div>
        {loading ? (
          <p
            style={{
              color: T.muted,
              fontSize: 12,
              padding: "16px",
              margin: 0,
              textAlign: "center",
            }}
          >
            Loading notifications…
          </p>
        ) : notifications.length === 0 ? (
          <p
            style={{
              color: T.muted,
              fontSize: 12,
              padding: "16px",
              margin: 0,
              textAlign: "center",
            }}
          >
            You have no notifications
          </p>
        ) : (
          notifications.map((n) => {
            const unread = !n.read_by?.includes(userId);
            return (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid ${T.border}`,
                  cursor: "pointer",
                  background: unread ? "rgba(255,122,0,0.06)" : "transparent",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: unread ? T.orange : "transparent",
                    marginTop: 5,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <p
                    style={{
                      color: "white",
                      fontSize: 13,
                      fontWeight: 600,
                      margin: "0 0 2px",
                    }}
                  >
                    {n.title}
                  </p>
                  <p
                    style={{
                      color: T.muted,
                      fontSize: 12,
                      margin: "0 0 2px",
                      lineHeight: 1.4,
                    }}
                  >
                    {n.body}
                  </p>
                  <p style={{ color: T.dim, fontSize: 11, margin: 0 }}>
                    {formatNotifTime(n.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

// Mockup-01 memakai blok oranye rata dengan sudut bawah membulat, avatarlingkaran
// putih, dan pill statistik biru navy (#212649) yang menindih batas oranye.
function HomeHeader({ onNavigate }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const { xp, level, streak } = useGame();
  const { user, displayName, avatarUrl } = useAuth();
  const { notifications } = useCatalog();
  const unread = notifications.filter(
    (n) => !n.read_by?.includes(user?.id ?? ""),
  ).length;
  const bellRef = useRef(null);

  return (
    <div
      style={{
        background: T.orange,
        borderRadius: "0 0 28px 28px",
        paddingBottom: 28,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -24,
          right: -24,
          width: 130,
          height: 130,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 18,
          right: 64,
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -30,
          left: -20,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          pointerEvents: "none",
        }}
      />

      <div style={{ padding: "16px 16px 0", position: "relative" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Avatar — foto profil akun Google, fallback ke logo brand */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <FoxFaceSVG size={44} />
              )}
            </div>
            <div>
              <p
                style={{
                  color: T.cream,
                  fontSize: 15,
                  fontWeight: 600,
                  margin: "0 0 4px",
                }}
              >
                Hello, {displayName}!
              </p>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: "rgba(255,255,255,0.22)",
                  borderRadius: 20,
                  padding: "2px 10px",
                }}
              >
                <Shield size={12} color="#FFFFFF" style={{ flexShrink: 0 }} />
                <span
                  style={{ color: "#FFFFFF", fontWeight: 800, fontSize: 13 }}
                >
                  Level {level}
                </span>
              </div>
            </div>
          </div>

          <div style={{ position: "relative" }} ref={bellRef}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              aria-label="Notifications"
              style={{
                position: "relative",
                padding: 9,
                borderRadius: 12,
                background: "rgba(255,255,255,0.2)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={20} color="white" />
              {unread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: T.danger,
                    border: "2px solid transparent",
                  }}
                />
              )}
            </button>
            <NotifDrawer
              open={notifOpen}
              onClose={() => setNotifOpen(false)}
              anchorRef={bellRef}
            />
          </div>
        </div>

        {/* Row 2: stats — navy pills overlapping the orange edge, per mockup */}
        <div style={{ display: "flex", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: T.raised,
              borderRadius: 99,
              padding: "5px 14px",
            }}
          >
            <Flame size={14} color="#FFFFFF" fill="#FFFFFF" />
            <span style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 15 }}>
              {streak}
            </span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
              days
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: T.raised,
              borderRadius: 99,
              padding: "5px 14px",
            }}
          >
            <Star size={14} color="#FFFFFF" fill="#FFFFFF" />
            <span style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 15 }}>
              {xp}
            </span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
              XP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DailyGoalBar({ onNavigate }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 350);
    return () => clearTimeout(t);
  }, []);
  const { dailyGoalProgress } = useGame();
  const pct = dailyGoalProgress;

  return (
    <div>
      <br />
      <div
        style={{
          position: "relative",
          background: T.hero,
          borderRadius: 20,
          padding: "16px 18px",
          border: `1px solid ${T.border}`,
        }}
      >
        <p
          style={{
            position: "relative",
            zIndex: 1,
            color: "white",
            fontWeight: 700,
            fontSize: 14,
            margin: "0 0 10px",
          }}
        >
          Daily Goal Progress: {pct}%
        </p>
        {/* Mascot diperbesar sengaja supaya luber melebihi tinggi kartu */}
        <img
          src={BRAND_ASSETS.mascot}
          alt="LearnGo mascot"
          width={80}
          height={mascotH(80)}
          style={{
            position: "absolute",
            right: 12,
            top: -10,
            width: 80,
            height: mascotH(80),
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
        {/* Knob logo dipisah dari barisan fill supaya tidak ikut terpotong oleh
            overflow:hidden; wrapper di luar tidak memotong, jadi knob boleh luber. */}
        <div style={{ position: "relative", zIndex: 1, marginRight: 96 }}>
          <div
            style={{
              height: 12,
              background: T.raised,
              borderRadius: 99,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: mounted ? `${pct}%` : "0%",
                background: T.orange,
                borderRadius: 99,
                transition: "width 1.3s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>
          {mounted && pct > 5 && (
            <div
              style={{
                position: "absolute",
                left: `${pct}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "white",
                border: `2px solid ${T.orange}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                transition: "left 1.3s cubic-bezier(0.22,1,0.36,1)",
                pointerEvents: "none",
              }}
            >
              <img
                src={BRAND_ASSETS.logo}
                alt=""
                width={17}
                height={17}
                style={{ width: 17, height: 17, display: "block" }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mockup-01 memakai kartu quest ringkas: kotak ikon, judul, pill kesulitan,
// label XP, lalu tombol aksi oranye.
const diffStyle = {
  blue: { bg: "rgba(56,189,248,0.15)", color: "#7DD3FC" },
  orange: { bg: "rgba(255,122,0,0.18)", color: "#FF9A40" },
  purple: { bg: "rgba(167,139,250,0.15)", color: "#C4B5FD" },
  emerald: { bg: "rgba(16,185,129,0.15)", color: "#6EE7B7" },
};

// Sama seperti halaman Quests: klik hanya mengarahkan user ke tempat quest itu
// dikerjakan, jadi quest tidak pernah diselesaikan tanpa aktivitas nyata.
const QUEST_ROUTES = {
  finish_lesson: "learn",
  perfect_quiz: "quiz",
  chat_community: "community",
  study_streak: "learn",
  all_languages: "learn",
};

function QuestCard({ quest, onStart }) {
  const { questsDone } = useGame();
  const done = !!questsDone[quest.id];
  const diff = diffStyle[quest.difficultyColor] || diffStyle.blue;
  const pct =
    quest.total > 0 ? Math.round((quest.progress / quest.total) * 100) : 0;

  const handleStart = () => {
    onStart(QUEST_ROUTES[quest.id] ?? "learn");
  };

  return (
    <div
      style={{
        background: T.card,
        borderRadius: 20,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minWidth: 152,
        maxWidth: 168,
        border: `1px solid ${done ? "rgba(52,211,153,0.28)" : T.border}`,
        transition: "all 0.2s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!done) e.currentTarget.style.borderColor = "rgba(255,122,0,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = done
          ? "rgba(52,211,153,0.28)"
          : T.border;
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          className="icon-box icon-box-sm"
          style={{ background: T.raised, color: T.orange }}
        >
          {quest.iconComponent ?? <Code2 size={16} />}
        </div>
        {done && <Check size={14} color="#34D399" style={{ flexShrink: 0 }} />}
      </div>
      <p
        style={{
          flex: 1,
          minWidth: 0,
          color: "white",
          fontWeight: 700,
          fontSize: 12.5,
          lineHeight: 1.3,
          margin: 0,
        }}
      >
        {quest.title}
      </p>
      <span
        style={{
          display: "inline-block",
          borderRadius: 99,
          padding: "2px 8px",
          fontSize: 10.5,
          fontWeight: 600,
          background: diff.bg,
          color: diff.color,
          width: "fit-content",
        }}
      >
        {quest.difficulty}
      </span>
      {quest.total > 0 && (
        <div
          style={{
            height: 4,
            background: T.raised,
            borderRadius: 99,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${done ? 100 : pct}%`,
              background: done ? "#34D399" : T.orange,
              borderRadius: 99,
              transition: "width 0.5s",
            }}
          />
        </div>
      )}
      <p style={{ color: T.orange, fontWeight: 700, fontSize: 12, margin: 0 }}>
        +{quest.xp} XP
      </p>
      {done ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            justifyContent: "center",
            padding: "7px 0",
            color: "#34D399",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <Check size={12} /> Completed!
        </div>
      ) : (
        <button
          onClick={handleStart}
          style={{
            background: T.orange,
            color: "white",
            fontWeight: 700,
            fontSize: 12.5,
            border: "none",
            borderRadius: 12,
            padding: "8px 0",
            cursor: "pointer",
            transition: "background 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = T.glow)}
          onMouseLeave={(e) => (e.currentTarget.style.background = T.orange)}
        >
          Start
          <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

function ContinueLearningCard({ onResume }) {
  const { getLangProgress, activeLang, completedLevels, dailyGoalProgress } =
    useGame();
  const prog = getLangProgress(activeLang);

  const langInfo = languages.find((l) => l.id === activeLang) ?? languages[0];
  const lessons = lessonsByLang[activeLang] ?? [];
  const done = completedLevels[activeLang] ?? [];

  // Lesson berikutnya = yang pertama belum selesai. Kalau semuanya selesai,
  // kartu ini menampilkan estado selesai, bukan lesson palsu.
  const nextIdx = lessons.findIndex((_, i) => !done[i]);
  const allDone = nextIdx === -1;
  const nextLesson = allDone ? null : lessons[nextIdx];
  const chapterLabel = nextLesson
    ? (chapterTitles[activeLang]?.[nextLesson.chapter - 1] ??
      `Chapter ${nextLesson.chapter}`)
    : "All chapters";

  return (
    <div
      style={{
        background: T.card,
        borderRadius: 20,
        overflow: "hidden",
        border: `1px solid ${T.border}`,
      }}
    >
      <div
        style={{
          padding: "14px 18px 10px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p
            style={{
              color: "white",
              fontWeight: 800,
              fontSize: 16,
              margin: "0 0 2px",
            }}
          >
            {allDone ? `${langInfo.label} Path complete` : nextLesson.title}
          </p>
          <p style={{ color: T.muted, fontSize: 12, margin: 0 }}>
            {allDone
              ? "Every lesson in this track is finished"
              : `Lesson ${nextIdx + 1} of ${lessons.length}`}
          </p>
        </div>
        <span
          style={{
            background: "rgba(255,122,0,0.15)",
            color: T.orange,
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 99,
            border: "1px solid rgba(255,122,0,0.3)",
            maxWidth: 150,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {chapterLabel}
        </span>
      </div>

      <div
        style={{
          padding: "10px 18px",
          background: "rgba(167,139,250,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderTop: `1px solid ${T.border}`,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "rgba(139,92,246,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: "1px solid rgba(139,92,246,0.35)",
          }}
        >
          <Brain size={16} color="#C4B5FD" />
        </div>
        <div>
          <p
            style={{
              color: T.orange,
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              margin: "0 0 2px",
            }}
          >
            AI Tutor — Socratic Mode
          </p>
          <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>
            {nextLesson?.mascotSpeech ??
              "Pick another track from Study Path to keep learning."}
          </p>
        </div>
      </div>

      <div style={{ padding: "12px 18px 16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <p
            style={{
              color: T.muted,
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              margin: 0,
            }}
          >
            {langInfo.label} Track
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: T.muted, fontSize: 12 }}>
              {prog.done}/{prog.total} lessons
            </span>
            <span style={{ color: T.orange, fontWeight: 700, fontSize: 13 }}>
              {prog.pct}%
            </span>
          </div>
        </div>
        <div
          style={{
            height: 8,
            background: T.raised,
            borderRadius: 99,
            overflow: "hidden",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${prog.pct}%`,
              background: T.orange,
              borderRadius: 99,
              transition: "width 0.6s",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <p
            style={{
              color: T.muted,
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              margin: 0,
            }}
          >
            Daily Goal
          </p>
          <span style={{ color: "#4ADE80", fontWeight: 700, fontSize: 12 }}>
            {dailyGoalProgress}%
          </span>
        </div>
        <div
          style={{
            height: 6,
            background: T.raised,
            borderRadius: 99,
            overflow: "hidden",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${dailyGoalProgress}%`,
              background: "#22C55E",
              borderRadius: 99,
              transition: "width 0.6s",
            }}
          />
        </div>

        <button
          onClick={onResume}
          style={{
            width: "100%",
            background: T.orange,
            color: "white",
            fontWeight: 700,
            fontSize: 14,
            border: "none",
            borderRadius: 14,
            padding: "13px 0",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = T.glow)}
          onMouseLeave={(e) => (e.currentTarget.style.background = T.orange)}
        >
          <Play size={14} fill="white" color="white" />
          {allDone ? "Review Lessons" : "Resume Socratic Learning"}
        </button>
      </div>
    </div>
  );
}

// Mockup-01: judul putih tebal di kiri, "See All" oranye kecil di kanan.
function SectionHeader({ title, label, onClick }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 20,
        marginBottom: 10,
      }}
    >
      <p style={{ color: "white", fontWeight: 800, fontSize: 17, margin: 0 }}>
        {title}
      </p>
      <button
        onClick={onClick}
        style={{
          color: T.orange,
          fontSize: 12,
          fontWeight: 600,
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        {label} <ChevronRight size={12} />
      </button>
    </div>
  );
}

export default function HomeScreen({ onNavigate }) {
  const { displayName } = useAuth();
  const { quests, loading: questsLoading } = useCatalog();

  // Baris tabel `quests` sudah membawa kode quest, XP, dan target; status
  // selesai tetap datang dari GameContext karena itu state per user.
  const questList = quests.map((q) => ({
    id: q.quest_code,
    title: q.title,
    description: q.description,
    xp: q.xp_reward,
    // Kolom difficulty dan category tidak ada di tabel quests. Setiap quest di
    // katalog ini harian, jadi labelnya diturunkan dari data yang ada.
    difficulty: "Daily",
    difficultyColor: "orange",
    category: "Daily goal",
    iconComponent: <Code2 size={17} />,
    // Progres selalu 0 sampai quest diselesaikan lewat completeQuest, karena
    // katalog tidak menyimpan hitungan parsial per quest.
    progress: 0,
    total: q.target,
  }));

  return (
    <div
      style={{ minHeight: "100vh", background: T.bg }}
      className="animate-fade-in"
    >
      <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <HomeHeader onNavigate={onNavigate} />

      <div style={{ padding: "0 16px 32px" }}>
        <div style={{ marginTop: 16 }}>
          <DailyGoalBar onNavigate={onNavigate} />
        </div>

        <SectionHeader
          title="Daily Quests"
          label="See all"
          onClick={() => onNavigate("quests")}
        />
        <div
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            paddingBottom: 6,
          }}
          className="no-scrollbar"
        >
          {questsLoading ? (
            <p
              style={{
                color: T.muted,
                fontSize: 12,
                padding: "8px 0",
                margin: 0,
              }}
            >
              Loading quests…
            </p>
          ) : questList.length === 0 ? (
            <p
              style={{
                color: T.muted,
                fontSize: 12,
                padding: "8px 0",
                margin: 0,
              }}
            >
              No daily quests available right now.
            </p>
          ) : (
            questList.map((q) => (
              <QuestCard
                key={q.id}
                quest={q}
                onStart={(route) => onNavigate(route)}
              />
            ))
          )}
        </div>

        <SectionHeader
          title="Continue Learning"
          label="View all"
          onClick={() => onNavigate("learn")}
        />
        <ContinueLearningCard onResume={() => onNavigate("learn")} />
      </div>
    </div>
  );
}
