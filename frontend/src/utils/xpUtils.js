import { getScopedJson, getScopedItem, setScopedItem } from "./userScopedStorage";

// XP VALUES
export const XP_VALUES = {
  lesson_complete: 20,
  quiz_complete_base: 30,
  mission_complete: 50, // base, each mission can override this
};

// Quiz XP is based on score percentage
// score is 0-100
export function calculateQuizXP(scorePercent) {
  if (scorePercent >= 90) return 50;
  if (scorePercent >= 75) return 40;
  if (scorePercent >= 60) return 30;
  if (scorePercent >= 40) return 20;
  return 10; // participation points even for low scores
}

// LEVEL THRESHOLDS
export const LEVELS = [
  {
    id: "turtle",
    name: "Turtle",
    emoji: "🐢",
    minXP: 0,
    maxXP: 499,
    description: "Just getting started. Slow and steady wins the race.",
    color: "#6BCB77"
  },
  {
    id: "rabbit",
    name: "Rabbit",
    emoji: "🐇",
    minXP: 500,
    maxXP: 999,
    description: "Building momentum. You're picking up speed.",
    color: "#FFD93D"
  },
  {
    id: "bull",
    name: "Bull",
    emoji: "🐂",
    minXP: 1000,
    maxXP: Infinity,
    description: "Full force. You're trading like a pro.",
    color: "#FF6B6B"
  }
];

export function getLevelFromXP(xp) {
  return LEVELS.find(level => xp >= level.minXP && xp <= level.maxXP) || LEVELS[0];
}

export function getXPProgress(xp) {
  const current = getLevelFromXP(xp);
  const currentIndex = LEVELS.indexOf(current);
  const isMaxLevel = currentIndex === LEVELS.length - 1;
  if (isMaxLevel) return { percent: 100, xpInLevel: xp - current.minXP, xpNeeded: 0 };
  const next = LEVELS[currentIndex + 1];
  const xpInLevel = xp - current.minXP;
  const xpNeeded = next.minXP - current.minXP;
  const percent = Math.min(Math.round((xpInLevel / xpNeeded) * 100), 100);
  return { percent, xpInLevel, xpNeeded, nextLevel: next };
}

// STORAGE
export function getTotalXP() {
  return parseInt(getScopedItem("totalXP") || "0");
}

export function getXPHistory() {
  return getScopedJson("xpHistory", []);
}

function emitXPEvent(amount) {
  window.dispatchEvent(new CustomEvent("xp-earned", { detail: { amount } }));
}

export function addXP(amount, reason) {
  const current = getTotalXP();
  const newTotal = current + amount;
  setScopedItem("totalXP", String(newTotal));

  // Save to XP history log
  const history = getXPHistory();
  history.unshift({
    amount,
    reason,
    total: newTotal,
    date: new Date().toISOString()
  });
  setScopedItem("xpHistory", JSON.stringify(history.slice(0, 50)));
  emitXPEvent(amount);
  return newTotal;
}

export function getCurrentLevel() {
  return getLevelFromXP(getTotalXP());
}
