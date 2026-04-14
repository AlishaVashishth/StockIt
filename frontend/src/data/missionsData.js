export const missionsData = [
  {
    id: "mission-buy-large-cap",
    title: "Buy your first Large Cap stock",
    description: "Purchase a large cap stock in the trade section",
    xp: 50,
    target: 1,
    verificationType: "honor",
    canUndo: false
  },
  {
    id: "mission-hold-3-days",
    title: "Hold a stock for 3 days",
    description: "Hold any stock position for 3 consecutive days",
    xp: 75,
    target: 3,
    verificationType: "progress",
    triggerEvent: "stock_held_day",
    canUndo: false
  },
  {
    id: "mission-5-stock-portfolio",
    title: "Build a 5-stock portfolio",
    description: "Have 5 different stocks in your portfolio at once",
    xp: 100,
    target: 1,
    verificationType: "honor",
    canUndo: false
  },
  {
    id: "mission-complete-3-lessons",
    title: "Complete 3 lessons",
    description: "Finish any 3 lessons in the learning section",
    xp: 60,
    target: 3,
    verificationType: "auto",
    triggerEvent: "lesson_complete",
    canUndo: false
  },
  {
    id: "mission-complete-a-module",
    title: "Complete your first module",
    description: "Finish all lessons and quizzes in any module",
    xp: 120,
    target: 1,
    verificationType: "auto",
    triggerEvent: "module_complete",
    canUndo: false
  },
  {
    id: "mission-quiz-score-80",
    title: "Score 80% or higher on a quiz",
    description: "Get at least 80% on any quiz",
    xp: 80,
    target: 1,
    verificationType: "auto",
    triggerEvent: "quiz_score_80",
    canUndo: false
  },
  {
    id: "mission-complete-all-modules",
    title: "Complete all modules",
    description: "Finish all modules in the learning path",
    xp: 180,
    target: 1,
    verificationType: "auto",
    triggerEvent: "all_modules_complete",
    canUndo: false
  },
  {
    id: "mission-streak-5-days",
    title: "5-day learning streak",
    description: "Complete learning on 5 days",
    xp: 120,
    target: 5,
    verificationType: "progress",
    triggerEvent: "learning_day",
    canUndo: false
  },
  {
    id: "mission-score-100",
    title: "Perfect quiz score",
    description: "Score 100% on any quiz",
    xp: 100,
    target: 1,
    verificationType: "auto",
    triggerEvent: "quiz_score_100",
    canUndo: false
  }
];

export const missionBatches = [
  ["mission-buy-large-cap", "mission-hold-3-days", "mission-5-stock-portfolio"],
  ["mission-complete-3-lessons", "mission-complete-a-module", "mission-quiz-score-80"],
  ["mission-complete-all-modules", "mission-streak-5-days", "mission-score-100"]
];
