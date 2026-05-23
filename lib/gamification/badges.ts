export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  check: (stats: any) => boolean;
}

export const BADGES: Badge[] = [
  {
    id: "first_lesson",
    name: "First Step",
    emoji: "👣",
    description: "Complete your first lesson",
    check: (s) => s.lessons_completed >= 1,
  },
  {
    id: "ten_lessons",
    name: "Decade Scholar",
    emoji: "📚",
    description: "Complete 10 lessons",
    check: (s) => s.lessons_completed >= 10,
  },
  {
    id: "fifty_lessons",
    name: "Half Century",
    emoji: "🎓",
    description: "Complete 50 lessons",
    check: (s) => s.lessons_completed >= 50,
  },
  {
    id: "streak_3",
    name: "Consistent",
    emoji: "🔥",
    description: "Maintain a 3-day streak",
    check: (s) => s.current_streak >= 3,
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    emoji: "⚡",
    description: "7-day streak",
    check: (s) => s.current_streak >= 7,
  },
  {
    id: "streak_30",
    name: "Unstoppable",
    emoji: "💎",
    description: "30-day streak",
    check: (s) => s.current_streak >= 30,
  },
  {
    id: "curious",
    name: "Curious Mind",
    emoji: "🤔",
    description: "Ask the AI mentor 10 questions",
    check: (s) => s.mentor_chats >= 10,
  },
  {
    id: "phase_1_done",
    name: "Foundations Built",
    emoji: "🏗️",
    description: "Complete all Phase 1 lessons",
    check: (s) => s.phase_1_complete,
  },
  {
    id: "level_5",
    name: "Data Explorer",
    emoji: "🗺️",
    description: "Reach Level 5",
    check: (s) => s.level >= 5,
  },
  {
    id: "xp_1000",
    name: "1K Club",
    emoji: "🏆",
    description: "Earn 1000 XP",
    check: (s) => s.total_xp >= 1000,
  },
];
