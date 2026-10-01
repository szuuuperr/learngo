'use client'

import Image from 'next/image'
import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import {
  user,
  dailyQuests,
  continueLearning,
  notifications,
} from "../data/mockData";
import { LearnGoIcon, FoxFaceSVG } from "../components/LearnGoLogo";
import { useGame } from "../context/GameContext";

// Served from /public by Next.js — reference by URL, not by import.
const maskotSVG = "/learngo/Aset-06.svg";

// ─── Floating Fox SVG ─────────────────────────────────────────────────────────
function FloatingFox({ size = 72 }) {
  return (
    <div
      style={{
        animation: "float 3s ease-in-out infinite",
        display: "inline-flex",
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size * 1.2} viewBox="0 0 80 96" fill="none">
        <ellipse cx="40" cy="78" rx="18" ry="14" fill="#E8650A" />
        <circle cx="40" cy="44" r="22" fill="#E8650A" />
        <polygon points="20,28 14,10 30,24" fill="#E8650A" />
        <polygon points="60,28 66,10 50,24" fill="#E8650A" />
        <polygon points="21,26 17,14 28,23" fill="#FFBA7A" />
        <polygon points="59,26 63,14 52,23" fill="#FFBA7A" />
        <ellipse cx="40" cy="50" rx="15" ry="14" fill="#FFE4C0" />
        <ellipse cx="31" cy="40" rx="6" ry="7" fill="#1E1E2E" />
        <ellipse cx="49" cy="40" rx="6" ry="7" fill="#1E1E2E" />
        <ellipse cx="32.5" cy="38" rx="2" ry="2.5" fill="white" />
        <ellipse cx="50.5" cy="38" rx="2" ry="2.5" fill="white" />
        <ellipse cx="40" cy="51" rx="4" ry="3" fill="#9C4A10" />
        <path
          d="M 35 55 Q 40 59 45 55"
          stroke="#9C4A10"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M 55 82 Q 70 76 66 88 Q 62 94 56 88" fill="#E8650A" />
        <path d="M 57 83 Q 68 78 65 87 Q 62 92 58 87" fill="#FFBA7A" />
      </svg>
    </div>
  );
}

// ─── Notification Drawer ──────────────────────────────────────────────────────
function NotifDrawer({ open, onClose }) {
  const [notifs, setNotifs] = useState(notifications);
  if (!open) return null;
  const markRead = (id) =>
    setNotifs((n) => n.map((x) => (x.id === id ? { ...x, unread: false } : x)));
  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 40 }}
        onClick={onClose}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 60,
          width: 300,
          background: "#111827",
          border: "1px solid #1F2E45",
          borderRadius: 16,
          zIndex: 50,
          overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          animation: "slideDown 0.2s ease-out",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #1F2E45",
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
              color: "#4B5563",
            }}
          >
            <X size={16} />
          </button>
        </div>
        {notifs.map((n) => (
          <div
            key={n.id}
            onClick={() => markRead(n.id)}
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #1F2E4510",
              cursor: "pointer",
              background: n.unread ? "rgba(255,122,0,0.04)" : "transparent",
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
                background: n.unread ? "#FF7A00" : "transparent",
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
                  color: "#64748B",
                  fontSize: 12,
                  margin: "0 0 2px",
                  lineHeight: 1.4,
                }}
              >
                {n.message}
              </p>
              <p style={{ color: "#374151", fontSize: 11, margin: 0 }}>
                {n.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Home Header ──────────────────────────────────────────────────────────────
function HomeHeader({ onNavigate }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = notifications.filter((n) => n.unread).length;
  const { xp, level, streak } = useGame();

  return (
    <div
      style={{
        background: "linear-gradient(150deg,#FF7A00 0%,#D95F00 100%)",
        borderRadius: "0 0 28px 28px",
        paddingBottom: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          top: -24,
          right: -24,
          width: 130,
          height: 130,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.07)",
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
          background: "rgba(255,255,255,0.05)",
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
          background: "rgba(255,255,255,0.04)",
          pointerEvents: "none",
        }}
      />

      <div style={{ padding: "16px 16px 0", position: "relative" }}>
        {/* Row 1: avatar + name + bell */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Avatar */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.25)",
                border: "2px solid rgba(255,255,255,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <FoxFaceSVG size={36} />
            </div>
            <div>
              <p
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 12,
                  fontWeight: 500,
                  margin: "0 0 2px",
                }}
              >
                Hello, {user.name}! 👋
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
                <span style={{ fontSize: 12 }}>🏅</span>
                <span style={{ color: "white", fontWeight: 800, fontSize: 13 }}>
                  Level {level}
                </span>
              </div>
            </div>
          </div>

          {/* Bell */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
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
                    background: "#FF2D55",
                    border: "2px solid transparent",
                  }}
                />
              )}
            </button>
            <NotifDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
          </div>
        </div>

        {/* Row 2: stats */}
        <div style={{ display: "flex", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.22)",
              borderRadius: 99,
              padding: "5px 14px",
            }}
          >
            <Flame size={14} color="white" fill="white" />
            <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>
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
              background: "rgba(255,255,255,0.22)",
              borderRadius: 99,
              padding: "5px 14px",
            }}
          >
            <Star size={14} color="white" fill="white" />
            <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>
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

// ─── Daily Goal Progress Bar ──────────────────────────────────────────────────
function DailyGoalBar({ onNavigate }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 350);
    return () => clearTimeout(t);
  }, []);
  const { dailyGoalProgress } = useGame();
  const pct = dailyGoalProgress;

  return (
    <div
      style={{
        background: "#111827",
        borderRadius: 20,
        padding: "16px 18px 14px",
        border: "1px solid #1F2E45",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div>
          <p
            style={{
              color: "white",
              fontWeight: 700,
              fontSize: 14,
              margin: "0 0 2px",
            }}
          >
            Daily Goal
          </p>
          <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>
            {pct}% complete
          </p>
        </div>
        {/* <FloatingFox size={60} /> */}
        <Image src={maskotSVG} alt="LearnGo fox mascot" width={60} height={60} />
      </div>
      {/* Track */}
      <div
        style={{
          height: 12,
          background: "#1F2E45",
          borderRadius: 99,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            width: mounted ? `${pct}%` : "0%",
            background: "linear-gradient(90deg,#FF7A00,#FFAA00)",
            borderRadius: 99,
            transition: "width 1.3s cubic-bezier(0.22,1,0.36,1)",
            position: "relative",
          }}
        >
          {mounted && pct > 5 && (
            <div
              style={{
                position: "absolute",
                right: -12,
                top: "50%",
                transform: "translateY(-50%)",
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "white",
                border: "2px solid #FF7A00",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(255,122,0,0.4)",
              }}
            >
              {/* <FoxFaceSVG size={17}/> */}
            </div>
          )}
        </div>
      </div>
      {/* Milestones */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
          paddingLeft: 0,
        }}
      >
        {[25, 50, 75, 100].map((m) => (
          <span
            key={m}
            style={{
              fontSize: 10,
              color: pct >= m ? "#FF7A00" : "#374151",
              fontWeight: 600,
            }}
          >
            {m}%
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Quest card ───────────────────────────────────────────────────────────────
const diffStyle = {
  blue: { bg: "rgba(59,130,246,0.15)", color: "#93C5FD" },
  orange: { bg: "rgba(249,115,22,0.15)", color: "#FB923C" },
  purple: { bg: "rgba(139,92,246,0.15)", color: "#C4B5FD" },
  emerald: { bg: "rgba(16,185,129,0.15)", color: "#6EE7B7" },
};

function QuestCard({ quest, onStart }) {
  const { questsDone, completeQuest, earnXP } = useGame();
  const done = !!(questsDone[quest.id] || quest.completed);
  const diff = diffStyle[quest.difficultyColor] || diffStyle.blue;
  const pct =
    quest.total > 0 ? Math.round((quest.progress / quest.total) * 100) : 0;

  const handleStart = () => {
    if (!done) {
      completeQuest(quest.id);
      earnXP(quest.xp);
    }
    onStart(quest);
  };

  return (
    <div
      style={{
        background: "#111827",
        borderRadius: 16,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 148,
        maxWidth: 160,
        border: `1px solid ${done ? "rgba(52,211,153,0.2)" : "#1F2E45"}`,
        transition: "all 0.2s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!done) e.currentTarget.style.borderColor = "rgba(255,122,0,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = done
          ? "rgba(52,211,153,0.2)"
          : "#1F2E45";
      }}
    >
      {/* Icon + done badge */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "#1A2640",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
          }}
        >
          {quest.icon}
        </div>
        {done && <Check size={14} color="#34D399" />}
      </div>
      {/* Title */}
      <p
        style={{
          color: "white",
          fontWeight: 700,
          fontSize: 12.5,
          lineHeight: 1.35,
          margin: 0,
        }}
      >
        {quest.title}
      </p>
      {/* Difficulty */}
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
      {/* Progress bar */}
      {quest.total > 0 && (
        <div
          style={{
            height: 4,
            background: "#1F2E45",
            borderRadius: 99,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${done ? 100 : pct}%`,
              background: done ? "#34D399" : "#FF7A00",
              borderRadius: 99,
              transition: "width 0.5s",
            }}
          />
        </div>
      )}
      {/* XP */}
      <p style={{ color: "#FF7A00", fontWeight: 700, fontSize: 12, margin: 0 }}>
        +{quest.xp} XP
      </p>
      {/* CTA */}
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
            background: "#FF7A00",
            color: "white",
            fontWeight: 700,
            fontSize: 12.5,
            border: "none",
            borderRadius: 10,
            padding: "8px 0",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#FF9A40")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#FF7A00")}
        >
          Start →
        </button>
      )}
    </div>
  );
}

// ─── Continue Learning card ───────────────────────────────────────────────────
function ContinueLearningCard({ data, onResume }) {
  const { getLangProgress } = useGame();
  const prog = getLangProgress("python");

  return (
    <div
      style={{
        background: "#111827",
        borderRadius: 20,
        overflow: "hidden",
        border: "1px solid #1F2E45",
      }}
    >
      {/* Header */}
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
            {data.title}
          </p>
          <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>
            {data.subtitle}
          </p>
        </div>
        <span
          style={{
            background: "rgba(255,122,0,0.15)",
            color: "#FF7A00",
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 99,
            border: "1px solid rgba(255,122,0,0.25)",
          }}
        >
          {data.chapter}
        </span>
      </div>

      {/* AI Summary row */}
      <div
        style={{
          padding: "10px 18px",
          background: "rgba(167,139,250,0.05)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderTop: "1px solid #1F2E45",
          borderBottom: "1px solid #1F2E45",
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
            border: "1px solid rgba(139,92,246,0.3)",
          }}
        >
          <Brain size={16} color="#A78BFA" />
        </div>
        <div>
          <p
            style={{
              color: "#FF7A00",
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              margin: "0 0 2px",
            }}
          >
            AI Tutor — Socratic Mode
          </p>
          <p style={{ color: "#94A3B8", fontSize: 13, margin: 0 }}>
            {data.aiSummary}
          </p>
        </div>
      </div>

      {/* Progress + page info */}
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
              color: "#94A3B8",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              margin: 0,
            }}
          >
            Course Progress
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#64748B", fontSize: 12 }}>
              p.{data.lastPage}/{data.totalPages}
            </span>
            <span style={{ color: "#FF7A00", fontWeight: 700, fontSize: 13 }}>
              {data.progress}%
            </span>
          </div>
        </div>
        <div
          style={{
            height: 8,
            background: "#1F2E45",
            borderRadius: 99,
            overflow: "hidden",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${data.progress}%`,
              background: "linear-gradient(90deg,#FF7A00,#FFAA00)",
              borderRadius: 99,
            }}
          />
        </div>

        {/* Python game progress */}
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
              color: "#94A3B8",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              margin: 0,
            }}
          >
            Python Track
          </p>
          <span style={{ color: "#4ADE80", fontWeight: 700, fontSize: 12 }}>
            {prog.done}/10 levels
          </span>
        </div>
        <div
          style={{
            height: 6,
            background: "#1F2E45",
            borderRadius: 99,
            overflow: "hidden",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${prog.pct}%`,
              background: "linear-gradient(90deg,#22C55E,#4ADE80)",
              borderRadius: 99,
              transition: "width 0.6s",
            }}
          />
        </div>

        {/* CTA */}
        <button
          onClick={onResume}
          style={{
            width: "100%",
            background: "linear-gradient(90deg,#FF7A00,#FF9A40)",
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
            boxShadow: "0 4px 16px rgba(255,122,0,0.3)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow = "0 6px 24px rgba(255,122,0,0.5)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.boxShadow = "0 4px 16px rgba(255,122,0,0.3)")
          }
        >
          <Play size={14} fill="white" color="white" />
          Resume Socratic Learning
        </button>
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
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
      <p style={{ color: "white", fontWeight: 800, fontSize: 16, margin: 0 }}>
        {title}
      </p>
      <button
        onClick={onClick}
        style={{
          color: "#FF7A00",
          fontSize: 12.5,
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

// ─── Quick-access nav tiles ───────────────────────────────────────────────────
function QuickNav({ onNavigate }) {
  const { getLangProgress } = useGame();
  const pyProg = getLangProgress("python");
  const tiles = [
    {
      id: "game",
      icon: "🎮",
      label: "Game Map",
      sub: `${pyProg.done}/10 done`,
      color: "#38BDF8",
      bg: "rgba(56,189,248,0.08)",
    },
    {
      id: "learn",
      icon: "📚",
      label: "Study Path",
      sub: "4 paths available",
      color: "#A78BFA",
      bg: "rgba(167,139,250,0.08)",
    },
    {
      id: "tutor",
      icon: "🤖",
      label: "AI Tutor",
      sub: "Socratic mode ON",
      color: "#34D399",
      bg: "rgba(52,211,153,0.08)",
    },
    {
      id: "community",
      icon: "👥",
      label: "Community",
      sub: "4 peers online",
      color: "#FB923C",
      bg: "rgba(251,146,60,0.08)",
    },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {tiles.map((t) => (
        <button
          key={t.id}
          onClick={() => onNavigate(t.id)}
          style={{
            background: t.bg,
            border: `1px solid ${t.color}25`,
            borderRadius: 16,
            padding: "14px 14px",
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = `${t.color}50`;
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = `${t.color}25`;
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div style={{ fontSize: 22, marginBottom: 6 }}>{t.icon}</div>
          <p
            style={{
              color: "white",
              fontWeight: 700,
              fontSize: 13,
              margin: "0 0 2px",
            }}
          >
            {t.label}
          </p>
          <p style={{ color: "#64748B", fontSize: 11, margin: 0 }}>{t.sub}</p>
        </button>
      ))}
    </div>
  );
}

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
export default function HomeScreen({ onNavigate, onStartQuest }) {
  return (
    <div
      style={{ minHeight: "100vh", background: "#0A0F1E" }}
      className="animate-fade-in"
    >
      <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Orange header */}
      <HomeHeader onNavigate={onNavigate} />

      <div style={{ padding: "0 16px 32px" }}>
        {/* Daily Goal */}
        <div style={{ marginTop: 16 }}>
          <DailyGoalBar onNavigate={onNavigate} />
        </div>

        {/* Quick Navigation */}
        <SectionHeader
          title="Quick Access"
          label="All screens"
          onClick={() => onNavigate("other")}
        />
        <QuickNav onNavigate={onNavigate} />

        {/* Daily Quests */}
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
          {dailyQuests.map((q) => (
            <QuestCard
              key={q.id}
              quest={q}
              onStart={onStartQuest || (() => {})}
            />
          ))}
        </div>

        {/* Continue Learning */}
        <SectionHeader
          title="Continue Learning"
          label="View all"
          onClick={() => onNavigate("learn")}
        />
        <ContinueLearningCard
          data={continueLearning}
          onResume={() => onNavigate("tutor")}
        />
      </div>
    </div>
  );
}
