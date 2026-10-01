// ─── LearnGo — Complete 100-Level Curriculum Data ────────────────────────────
// Each language track has chapters → units → lessons
// Level 1-100 maps across all tracks proportionally

export const user = {
  name: 'Mirelle',
  username: '@mirelle',
  avatar: null,
  level: 5,
  xp: 450,
  xpToNext: 600,
  streak: 12,
  lives: 5,
  maxLives: 5,
  gems: 1200,
  keys: 3,
  dailyGoalProgress: 80,
  badges: ['🔥 Streak Master', '⚡ Quick Learner', '🧠 Logic Pro'],
  currentLanguage: 'python',
  currentChapter: 1,
  currentUnit: 1,
}

// ─── Language tracks available ────────────────────────────────────────────────
export const languages = [
  { id: 'python',     label: 'Python',     icon: '🐍', color: '#3B82F6', bgColor: '#1D4ED8', badge: 'PY' },
  { id: 'javascript', label: 'JavaScript', icon: '⚡', color: '#F59E0B', bgColor: '#D97706', badge: 'JS' },
  { id: 'cpp',        label: 'C++',        icon: '⚙️', color: '#8B5CF6', bgColor: '#7C3AED', badge: 'C++' },
  { id: 'dsa',        label: 'DSA',        icon: '📦', color: '#10B981', bgColor: '#059669', badge: 'DSA' },
]

// ─── Python — 100 Levels across 10 Chapters ───────────────────────────────────
const pythonLevels = [
  // Chapter 1: Python Basics (Levels 1–10)
  { level: 1,  chapter: 1, unit: 1, title: 'Print & Output',           xp: 10,  type: 'lesson',   done: true  },
  { level: 2,  chapter: 1, unit: 1, title: 'Variables',                xp: 10,  type: 'lesson',   done: true  },
  { level: 3,  chapter: 1, unit: 1, title: 'Data Types',               xp: 10,  type: 'lesson',   done: true  },
  { level: 4,  chapter: 1, unit: 2, title: 'String Operations',        xp: 15,  type: 'lesson',   done: true  },
  { level: 5,  chapter: 1, unit: 2, title: 'Number Arithmetic',        xp: 15,  type: 'lesson',   done: false, active: true },
  { level: 6,  chapter: 1, unit: 2, title: 'Input from User',          xp: 15,  type: 'lesson',   done: false },
  { level: 7,  chapter: 1, unit: 3, title: 'Type Conversion',          xp: 20,  type: 'lesson',   done: false },
  { level: 8,  chapter: 1, unit: 3, title: 'Comments & Style',         xp: 20,  type: 'lesson',   done: false },
  { level: 9,  chapter: 1, unit: 3, title: 'Chapter 1 Quiz',           xp: 30,  type: 'quiz',     done: false },
  { level: 10, chapter: 1, unit: 3, title: 'Chapter 1 Challenge',      xp: 50,  type: 'challenge',done: false },

  // Chapter 2: Control Flow (Levels 11–20)
  { level: 11, chapter: 2, unit: 1, title: 'Boolean & Comparison',     xp: 15,  type: 'lesson',   done: false },
  { level: 12, chapter: 2, unit: 1, title: 'if / else',                xp: 15,  type: 'lesson',   done: false },
  { level: 13, chapter: 2, unit: 1, title: 'elif Chains',              xp: 15,  type: 'lesson',   done: false },
  { level: 14, chapter: 2, unit: 2, title: 'Logical Operators',        xp: 20,  type: 'lesson',   done: false },
  { level: 15, chapter: 2, unit: 2, title: 'Nested Conditions',        xp: 20,  type: 'lesson',   done: false },
  { level: 16, chapter: 2, unit: 2, title: 'Match / Switch',           xp: 20,  type: 'lesson',   done: false },
  { level: 17, chapter: 2, unit: 3, title: 'Truthiness',               xp: 25,  type: 'lesson',   done: false },
  { level: 18, chapter: 2, unit: 3, title: 'Short-circuit Eval',       xp: 25,  type: 'lesson',   done: false },
  { level: 19, chapter: 2, unit: 3, title: 'Chapter 2 Quiz',           xp: 35,  type: 'quiz',     done: false },
  { level: 20, chapter: 2, unit: 3, title: 'Chapter 2 Challenge',      xp: 60,  type: 'challenge',done: false },

  // Chapter 3: Loops (Levels 21–30)
  { level: 21, chapter: 3, unit: 1, title: 'while Loop',               xp: 15,  type: 'lesson',   done: false },
  { level: 22, chapter: 3, unit: 1, title: 'for Loop',                 xp: 15,  type: 'lesson',   done: false },
  { level: 23, chapter: 3, unit: 1, title: 'range()',                  xp: 15,  type: 'lesson',   done: false },
  { level: 24, chapter: 3, unit: 2, title: 'break & continue',         xp: 20,  type: 'lesson',   done: false },
  { level: 25, chapter: 3, unit: 2, title: 'Nested Loops',             xp: 20,  type: 'lesson',   done: false },
  { level: 26, chapter: 3, unit: 2, title: 'Loop Patterns',            xp: 20,  type: 'lesson',   done: false },
  { level: 27, chapter: 3, unit: 3, title: 'List Comprehension',       xp: 25,  type: 'lesson',   done: false },
  { level: 28, chapter: 3, unit: 3, title: 'Enumerate & Zip',          xp: 25,  type: 'lesson',   done: false },
  { level: 29, chapter: 3, unit: 3, title: 'Chapter 3 Quiz',           xp: 35,  type: 'quiz',     done: false },
  { level: 30, chapter: 3, unit: 3, title: 'Chapter 3 Challenge',      xp: 70,  type: 'challenge',done: false },

  // Chapter 4: Functions (Levels 31–40)
  { level: 31, chapter: 4, unit: 1, title: 'Defining Functions',       xp: 20,  type: 'lesson',   done: false },
  { level: 32, chapter: 4, unit: 1, title: 'Parameters & Arguments',   xp: 20,  type: 'lesson',   done: false },
  { level: 33, chapter: 4, unit: 1, title: 'Return Values',            xp: 20,  type: 'lesson',   done: false },
  { level: 34, chapter: 4, unit: 2, title: 'Default Parameters',       xp: 25,  type: 'lesson',   done: false },
  { level: 35, chapter: 4, unit: 2, title: '*args & **kwargs',         xp: 25,  type: 'lesson',   done: false },
  { level: 36, chapter: 4, unit: 2, title: 'Scope & Global',           xp: 25,  type: 'lesson',   done: false },
  { level: 37, chapter: 4, unit: 3, title: 'Lambda Functions',         xp: 30,  type: 'lesson',   done: false },
  { level: 38, chapter: 4, unit: 3, title: 'Recursion',                xp: 30,  type: 'lesson',   done: false },
  { level: 39, chapter: 4, unit: 3, title: 'Chapter 4 Quiz',           xp: 40,  type: 'quiz',     done: false },
  { level: 40, chapter: 4, unit: 3, title: 'Chapter 4 Challenge',      xp: 80,  type: 'challenge',done: false },

  // Chapter 5: Data Structures (Levels 41–50)
  { level: 41, chapter: 5, unit: 1, title: 'Lists',                    xp: 20,  type: 'lesson',   done: false },
  { level: 42, chapter: 5, unit: 1, title: 'Tuples',                   xp: 20,  type: 'lesson',   done: false },
  { level: 43, chapter: 5, unit: 1, title: 'Dictionaries',             xp: 20,  type: 'lesson',   done: false },
  { level: 44, chapter: 5, unit: 2, title: 'Sets',                     xp: 25,  type: 'lesson',   done: false },
  { level: 45, chapter: 5, unit: 2, title: 'List Methods',             xp: 25,  type: 'lesson',   done: false },
  { level: 46, chapter: 5, unit: 2, title: 'Dict Methods',             xp: 25,  type: 'lesson',   done: false },
  { level: 47, chapter: 5, unit: 3, title: 'Slicing',                  xp: 30,  type: 'lesson',   done: false },
  { level: 48, chapter: 5, unit: 3, title: 'Sorting & Searching',      xp: 30,  type: 'lesson',   done: false },
  { level: 49, chapter: 5, unit: 3, title: 'Chapter 5 Quiz',           xp: 45,  type: 'quiz',     done: false },
  { level: 50, chapter: 5, unit: 3, title: 'Mid-Course Challenge',     xp: 100, type: 'challenge',done: false },

  // Chapter 6: OOP (Levels 51–60)
  { level: 51, chapter: 6, unit: 1, title: 'Classes & Objects',        xp: 25,  type: 'lesson',   done: false },
  { level: 52, chapter: 6, unit: 1, title: '__init__ Method',          xp: 25,  type: 'lesson',   done: false },
  { level: 53, chapter: 6, unit: 1, title: 'Instance Methods',         xp: 25,  type: 'lesson',   done: false },
  { level: 54, chapter: 6, unit: 2, title: 'Inheritance',              xp: 30,  type: 'lesson',   done: false },
  { level: 55, chapter: 6, unit: 2, title: 'Polymorphism',             xp: 30,  type: 'lesson',   done: false },
  { level: 56, chapter: 6, unit: 2, title: 'Encapsulation',            xp: 30,  type: 'lesson',   done: false },
  { level: 57, chapter: 6, unit: 3, title: 'Dunder Methods',           xp: 35,  type: 'lesson',   done: false },
  { level: 58, chapter: 6, unit: 3, title: 'Class vs Static Methods',  xp: 35,  type: 'lesson',   done: false },
  { level: 59, chapter: 6, unit: 3, title: 'Chapter 6 Quiz',           xp: 50,  type: 'quiz',     done: false },
  { level: 60, chapter: 6, unit: 3, title: 'Chapter 6 Challenge',      xp: 100, type: 'challenge',done: false },

  // Chapter 7: File & Error Handling (Levels 61–70)
  { level: 61, chapter: 7, unit: 1, title: 'try / except',             xp: 25,  type: 'lesson',   done: false },
  { level: 62, chapter: 7, unit: 1, title: 'Exception Types',          xp: 25,  type: 'lesson',   done: false },
  { level: 63, chapter: 7, unit: 1, title: 'finally & else',           xp: 25,  type: 'lesson',   done: false },
  { level: 64, chapter: 7, unit: 2, title: 'Raising Exceptions',       xp: 30,  type: 'lesson',   done: false },
  { level: 65, chapter: 7, unit: 2, title: 'File Open & Read',         xp: 30,  type: 'lesson',   done: false },
  { level: 66, chapter: 7, unit: 2, title: 'File Write & Append',      xp: 30,  type: 'lesson',   done: false },
  { level: 67, chapter: 7, unit: 3, title: 'with Statement',           xp: 35,  type: 'lesson',   done: false },
  { level: 68, chapter: 7, unit: 3, title: 'CSV & JSON Files',         xp: 35,  type: 'lesson',   done: false },
  { level: 69, chapter: 7, unit: 3, title: 'Chapter 7 Quiz',           xp: 50,  type: 'quiz',     done: false },
  { level: 70, chapter: 7, unit: 3, title: 'Chapter 7 Challenge',      xp: 110, type: 'challenge',done: false },

  // Chapter 8: Advanced Python (Levels 71–80)
  { level: 71, chapter: 8, unit: 1, title: 'Decorators',               xp: 30,  type: 'lesson',   done: false },
  { level: 72, chapter: 8, unit: 1, title: 'Generators & yield',       xp: 30,  type: 'lesson',   done: false },
  { level: 73, chapter: 8, unit: 1, title: 'Iterators',                xp: 30,  type: 'lesson',   done: false },
  { level: 74, chapter: 8, unit: 2, title: 'Async / Await',            xp: 35,  type: 'lesson',   done: false },
  { level: 75, chapter: 8, unit: 2, title: 'Context Managers',         xp: 35,  type: 'lesson',   done: false },
  { level: 76, chapter: 8, unit: 2, title: 'Type Hints',               xp: 35,  type: 'lesson',   done: false },
  { level: 77, chapter: 8, unit: 3, title: 'Dataclasses',              xp: 40,  type: 'lesson',   done: false },
  { level: 78, chapter: 8, unit: 3, title: 'functools & itertools',    xp: 40,  type: 'lesson',   done: false },
  { level: 79, chapter: 8, unit: 3, title: 'Chapter 8 Quiz',           xp: 55,  type: 'quiz',     done: false },
  { level: 80, chapter: 8, unit: 3, title: 'Chapter 8 Challenge',      xp: 120, type: 'challenge',done: false },

  // Chapter 9: Algorithms (Levels 81–90)
  { level: 81, chapter: 9, unit: 1, title: 'Big-O Notation',           xp: 30,  type: 'lesson',   done: false },
  { level: 82, chapter: 9, unit: 1, title: 'Linear & Binary Search',   xp: 30,  type: 'lesson',   done: false },
  { level: 83, chapter: 9, unit: 1, title: 'Bubble Sort',              xp: 30,  type: 'lesson',   done: false },
  { level: 84, chapter: 9, unit: 2, title: 'Merge Sort',               xp: 35,  type: 'lesson',   done: false },
  { level: 85, chapter: 9, unit: 2, title: 'Quick Sort',               xp: 35,  type: 'lesson',   done: false },
  { level: 86, chapter: 9, unit: 2, title: 'Recursion & Backtracking', xp: 35,  type: 'lesson',   done: false },
  { level: 87, chapter: 9, unit: 3, title: 'Dynamic Programming',      xp: 40,  type: 'lesson',   done: false },
  { level: 88, chapter: 9, unit: 3, title: 'Greedy Algorithms',        xp: 40,  type: 'lesson',   done: false },
  { level: 89, chapter: 9, unit: 3, title: 'Chapter 9 Quiz',           xp: 55,  type: 'quiz',     done: false },
  { level: 90, chapter: 9, unit: 3, title: 'Chapter 9 Challenge',      xp: 130, type: 'challenge',done: false },

  // Chapter 10: Final & Projects (Levels 91–100)
  { level: 91,  chapter: 10, unit: 1, title: 'Modules & Packages',     xp: 35,  type: 'lesson',   done: false },
  { level: 92,  chapter: 10, unit: 1, title: 'pip & Virtual Envs',     xp: 35,  type: 'lesson',   done: false },
  { level: 93,  chapter: 10, unit: 1, title: 'Testing with pytest',    xp: 35,  type: 'lesson',   done: false },
  { level: 94,  chapter: 10, unit: 2, title: 'REST API Basics',        xp: 40,  type: 'lesson',   done: false },
  { level: 95,  chapter: 10, unit: 2, title: 'Web Scraping',           xp: 40,  type: 'lesson',   done: false },
  { level: 96,  chapter: 10, unit: 2, title: 'Data Analysis Intro',    xp: 40,  type: 'lesson',   done: false },
  { level: 97,  chapter: 10, unit: 3, title: 'Final Project: CLI App', xp: 80,  type: 'project',  done: false },
  { level: 98,  chapter: 10, unit: 3, title: 'Final Project: API',     xp: 80,  type: 'project',  done: false },
  { level: 99,  chapter: 10, unit: 3, title: 'Final Quiz — All Topics',xp: 100, type: 'quiz',     done: false },
  { level: 100, chapter: 10, unit: 3, title: '🏆 Python Master!',      xp: 500, type: 'trophy',   done: false },
]

// ─── Daily Quests ─────────────────────────────────────────────────────────────
export const dailyQuests = [
  {
    id: 1,
    title: 'Python Loop Sprinter',
    description: 'Master for/while loops with 5 challenges',
    xp: 50,
    difficulty: 'Socratic AI',
    difficultyColor: 'blue',
    category: 'Python',
    icon: '</>',
    progress: 3,
    total: 5,
    completed: false,
  },
  {
    id: 2,
    title: 'Algorithm Sort Maze',
    description: 'Navigate Bubble, Merge & Quick Sort',
    xp: 75,
    difficulty: 'Interactive',
    difficultyColor: 'orange',
    category: 'Algorithms',
    icon: '🔀',
    progress: 0,
    total: 3,
    completed: false,
  },
  {
    id: 3,
    title: 'Data Structures Q',
    description: 'Implement FIFO queue from scratch',
    xp: 60,
    difficulty: 'Conceptual',
    difficultyColor: 'purple',
    category: 'Data Structures',
    icon: '📦',
    progress: 0,
    total: 4,
    completed: false,
  },
]

// ─── Continue Learning card ───────────────────────────────────────────────────
export const continueLearning = {
  title: 'Computer Architecture',
  subtitle: 'CS102 — Week 4',
  aiSummary: 'Reviewing: Merge Sort Complexity',
  progress: 82,
  chapter: 'Chapter 6: Memory Hierarchy',
  lastPage: 42,
  totalPages: 68,
}

// ─── Game levels per language ─────────────────────────────────────────────────
export const gameLevels = {
  python: pythonLevels,
  // JS / C++ / DSA use same structure — abbreviated for now
  javascript: pythonLevels.map(l => ({
    ...l,
    title: l.title.replace('Python', 'JS').replace('print', 'console.log'),
  })),
  cpp: pythonLevels.map(l => ({
    ...l,
    title: l.title.replace('Python', 'C++'),
  })),
  dsa: pythonLevels.map(l => ({
    ...l,
    title: l.title,
  })),
}

// ─── Lesson content bank ──────────────────────────────────────────────────────
export const lessonContent = {
  // Fill-in-the-blank lesson
  fillBlank: {
    type: 'fill_blank',
    instruction: 'Complete the program',
    mascotSpeech: 'Show Tokyo in the console.',
    language: 'python',
    codeTemplate: 'print( "Tokyo" )',
    codeOutput: 'Tokyo',
    blankWord: 'print',
    options: ['input', 'show', 'print'],
    correctIndex: 2,
    xp: 10,
  },
  // Multiple choice lesson
  multiChoice: {
    type: 'multi_choice',
    instruction: 'Choose the correct output',
    mascotSpeech: 'What does this show in the console?',
    language: 'python',
    codeSnippet: 'print("Harry Potter")',
    codeOutput: 'Harry Potter',
    options: ['"Harry Potter"', 'print("Harry Potter")', 'Harry Potter', 'Nothing'],
    correctIndex: 2,
    wrongExplanation: 'Think of print as an instruction to the computer: it removes the quotation marks and displays the words inside them. So print("Harry Potter") shows Harry Potter, not "Harry Potter" or the instruction itself. Does that make sense?',
    xp: 10,
  },
}

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = [
  { id: 1, type: 'streak', title: '🔥 Streak Reminder!', message: "Don't break your 12-day streak — complete today's quest.", time: '2h ago', unread: true },
  { id: 2, type: 'quest',  title: '⚡ New Quest Unlocked!', message: 'Graph Traversal BFS/DFS is now available.', time: '5h ago', unread: true },
  { id: 3, type: 'mentor', title: '💬 Mentor Reply', message: 'Dr. Budi replied to your Merge Sort question.', time: '1d ago', unread: false },
]

// ─── Community members ────────────────────────────────────────────────────────
export const communityMembers = [
  { id: 1, name: 'Sari Dewi',  level: 7, xp: 720, specialty: 'Algorithms',      avatar: 'SD', online: true  },
  { id: 2, name: 'Rafi Hakim', level: 4, xp: 380, specialty: 'Python',          avatar: 'RH', online: true  },
  { id: 3, name: 'Putri Ayu',  level: 6, xp: 610, specialty: 'Data Structures', avatar: 'PA', online: false },
  { id: 4, name: 'Bima Sakti', level: 3, xp: 240, specialty: 'C++',             avatar: 'BS', online: true  },
]

export const industrySkills = [
  { skill: 'Python',          level: 72, demand: 'High',     icon: '🐍' },
  { skill: 'Data Structures', level: 58, demand: 'High',     icon: '📦' },
  { skill: 'Algorithms',      level: 44, demand: 'Critical', icon: '🔀' },
  { skill: 'System Design',   level: 20, demand: 'High',     icon: '🏗️' },
  { skill: 'SQL / Databases', level: 35, demand: 'Medium',   icon: '🗄️' },
  { skill: 'Git & VCS',       level: 80, demand: 'Essential',icon: '🌿' },
]

export const mockAIResponses = [
  "That's an interesting question! Before I explain, let me ask: **What do you think happens when we split an array of 8 elements in Merge Sort?** How many splits would you expect?",
  "Good thinking! You're on the right track. Now, if each split takes O(1) time and we need to *merge* back — what operation do you think is most expensive: splitting or merging? Why?",
  "Exactly! Merging requires comparing and copying elements. If there are **n** elements total and we do this at each of the **log n** levels of the recursion tree — can you derive the final complexity now?",
  "You've got it! O(n log n) is correct. The key insight is: **log n levels × O(n) merge work per level = O(n log n)**.",
]
