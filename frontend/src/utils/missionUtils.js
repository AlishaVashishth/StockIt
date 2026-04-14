import { missionBatches, missionsData } from '../data/missionsData';

export function getCompletedMissions() {
  return JSON.parse(localStorage.getItem("completedMissions") || "[]");
}

export function isMissionComplete(missionId) {
  return getCompletedMissions().includes(missionId);
}

export function getMissionProgress(missionId) {
  const all = JSON.parse(localStorage.getItem("missionProgress") || "{}");
  return all[missionId] || { current: 0, target: 1 };
}

export function updateMissionProgress(missionId, current, target) {
  const all = JSON.parse(localStorage.getItem("missionProgress") || "{}");
  all[missionId] = { current, target };
  localStorage.setItem("missionProgress", JSON.stringify(all));
}

export function completeMission(missionId, xpReward, options = {}) {
  const mission = missionsData.find((m) => m.id === missionId);
  const allowHonor = Boolean(options?.allowHonor);
  // Honor missions must never auto-complete; require explicit manual confirmation path.
  if (mission?.verificationType === "honor" && !allowHonor) return 0;
  const completed = getCompletedMissions();
  if (completed.includes(missionId)) return 0; // already done, no XP
  completed.push(missionId);
  localStorage.setItem("completedMissions", JSON.stringify(completed));
  return xpReward; // return XP so caller can add it
}

export function getCurrentMissionBatch() {
  return parseInt(localStorage.getItem("currentMissionBatch") || "0");
}

export function getActiveMissions() {
  const batchIndex = getCurrentMissionBatch();
  const batch = missionBatches[batchIndex] || missionBatches[missionBatches.length - 1];
  return batch.map(id => missionsData.find(m => m.id === id)).filter(Boolean);
}

export function checkAndAdvanceBatch() {
  const batchIndex = getCurrentMissionBatch();
  const batch = missionBatches[batchIndex] || [];
  const allComplete = batch.every(id => isMissionComplete(id));
  if (allComplete && batchIndex < missionBatches.length - 1) {
    localStorage.setItem("currentMissionBatch", String(batchIndex + 1));
    window.dispatchEvent(new CustomEvent('new-missions-unlocked'));
    return true;
  }
  return false;
}
