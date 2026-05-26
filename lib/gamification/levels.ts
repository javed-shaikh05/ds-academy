// Level thresholds (XP required for each level)
// Formula: level N requires N * 100 XP cumulatively, with curve
export const RANKS = [
  { level: 1, minXP: 0, name: "Beginner", emoji: "🌱", color: "gray" },
  { level: 2, minXP: 100, name: "Curious Mind", emoji: "🧐", color: "gray" },
  { level: 3, minXP: 300, name: "Apprentice", emoji: "📖", color: "cyan" },
  { level: 4, minXP: 600, name: "Analyst", emoji: "📊", color: "cyan" },
  {
    level: 5,
    minXP: 1000,
    name: "Data Explorer",
    emoji: "🔍",
    color: "violet",
  },
  { level: 6, minXP: 1500, name: "ML Engineer", emoji: "⚙️", color: "violet" },
  { level: 7, minXP: 2200, name: "AI Specialist", emoji: "🤖", color: "pink" },
  { level: 8, minXP: 3000, name: "Deep Learner", emoji: "🧠", color: "pink" },
  { level: 9, minXP: 4000, name: "Data Wizard", emoji: "🧙", color: "orange" },
  {
    level: 10,
    minXP: 5500,
    name: "Research Scientist",
    emoji: "🔬",
    color: "orange",
  },
  {
    level: 11,
    minXP: 7500,
    name: "AI Architect",
    emoji: "🏛️",
    color: "yellow",
  },
  {
    level: 12,
    minXP: 10000,
    name: "Grandmaster",
    emoji: "👑",
    color: "yellow",
  },
];

export function getRank(xp: number) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXP) return RANKS[i];
  }
  return RANKS[0];
}

export function getNextRank(xp: number) {
  const current = getRank(xp);
  return RANKS.find((r) => r.level > current.level) || null;
}

export function progressToNextLevel(xp: number) {
  const current = getRank(xp);
  const next = getNextRank(xp);
  if (!next) return { pct: 100, xpInLevel: 0, xpForNext: 0 };
  const xpInLevel = xp - current.minXP;
  const xpForNext = next.minXP - current.minXP;
  return {
    pct: Math.round((xpInLevel / xpForNext) * 100),
    xpInLevel,
    xpForNext,
    xpNeeded: next.minXP - xp,
  };
}

// XP rewards per action
export const XP_REWARDS = {
  lesson_complete: 50,
  lesson_first_time: 25, // bonus for first lesson ever
  mentor_chat: 5, // per question
  streak_day: 20,
  streak_milestone: 100, // every 7 days
  mission_complete: 30,
  badge_earned: 75,
  phase_complete: 500,
  mcq_correct: 10,
  interview_complete: 100,
  project_review: 60,
};
