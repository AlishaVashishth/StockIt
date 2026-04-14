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

export function completeMission(missionId, xpReward) {
  const completed = getCompletedMissions();
  if (completed.includes(missionId)) return 0; // already done, no XP
  completed.push(missionId);
  localStorage.setItem("completedMissions", JSON.stringify(completed));
  return xpReward; // return XP so caller can add it
}
