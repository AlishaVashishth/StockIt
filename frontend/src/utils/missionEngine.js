import { missionsData } from '../data/missionsData';
import {
  checkAndAdvanceBatch,
  completeMission,
  getMissionProgress,
  isMissionComplete,
  updateMissionProgress,
} from './missionUtils';
import { addXP } from './xpUtils';
import { addRecentActivity } from './activityUtils';

// Call this whenever a tracked event happens in the app
// eventType matches the triggerEvent field in missionsData
// payload can carry extra info like { score: 85 }
export function fireMissionEvent(eventType, payload = {}) {
  const relevantMissions = missionsData.filter(
    m => m.triggerEvent === eventType && !isMissionComplete(m.id)
  );

  relevantMissions.forEach(mission => {
    if (mission.verificationType === "honor") return;
    if (mission.verificationType === "auto") {
      if (eventType === "quiz_score_80" && Number(payload?.score || 0) < 80) return;
      if (eventType === "quiz_score_100" && Number(payload?.score || 0) < 100) return;

      if (mission.target === 1) {
        // Single completion auto missions
        const xpEarned = completeMission(mission.id, mission.xp);
        if (xpEarned > 0) {
          addXP(xpEarned, `Completed mission: ${mission.title}`);
          addRecentActivity(`Completed Mission: ${mission.title}`);
          window.dispatchEvent(new CustomEvent('xp-earned', { detail: { amount: xpEarned, reason: mission.title } }));
          window.dispatchEvent(new CustomEvent('mission-completed', { detail: { missionId: mission.id } }));
          checkAndAdvanceBatch();
        }
      } else {
        const progress = getMissionProgress(mission.id);
        const newCurrent = Math.min((progress.current || 0) + 1, mission.target);
        updateMissionProgress(mission.id, newCurrent, mission.target);
        if (newCurrent >= mission.target) {
          const xpEarned = completeMission(mission.id, mission.xp);
          if (xpEarned > 0) {
            addXP(xpEarned, `Completed mission: ${mission.title}`);
            addRecentActivity(`Completed Mission: ${mission.title}`);
            window.dispatchEvent(new CustomEvent('xp-earned', { detail: { amount: xpEarned } }));
            window.dispatchEvent(new CustomEvent('mission-completed', { detail: { missionId: mission.id } }));
            checkAndAdvanceBatch();
          }
        } else {
          window.dispatchEvent(new CustomEvent('mission-progress', { detail: { missionId: mission.id, current: newCurrent, target: mission.target } }));
        }
      }
    }

    if (mission.verificationType === "progress") {
      const progress = getMissionProgress(mission.id);
      const incrementBy = Number(payload?.incrementBy || 1);
      const newCurrent = Math.min((progress.current || 0) + incrementBy, mission.target);
      updateMissionProgress(mission.id, newCurrent, mission.target);
      if (newCurrent >= mission.target) {
        const xpEarned = completeMission(mission.id, mission.xp);
        if (xpEarned > 0) {
          addXP(xpEarned, `Completed mission: ${mission.title}`);
          addRecentActivity(`Completed Mission: ${mission.title}`);
          window.dispatchEvent(new CustomEvent('xp-earned', { detail: { amount: xpEarned } }));
          window.dispatchEvent(new CustomEvent('mission-completed', { detail: { missionId: mission.id } }));
          checkAndAdvanceBatch();
        }
      } else {
        window.dispatchEvent(new CustomEvent('mission-progress', { detail: { missionId: mission.id, current: newCurrent, target: mission.target } }));
      }
    }
  });
}

// Call this to check and auto-complete any missions whose conditions are already met
// Run this on app startup to catch anything that was missed
export function syncMissionProgress(appState) {
  // appState should contain: { completedLessons, completedModules, quizScores, portfolioSize, daysHeld }

  // Check lesson count missions
  const lessonCount = (appState.completedLessons || []).filter((id) => String(id).includes("-lesson-")).length;
  const lessonMissions = missionsData.filter(
    m => m.triggerEvent === "lesson_complete" && m.verificationType !== "honor" && !isMissionComplete(m.id)
  );
  lessonMissions.forEach(m => {
    if (lessonCount >= m.target) {
      const xpEarned = completeMission(m.id, m.xp);
      if (xpEarned > 0) addXP(xpEarned, `Auto-completed mission: ${m.title}`);
    } else {
      updateMissionProgress(m.id, lessonCount, m.target);
    }
  });

  // Check quiz score missions
  const highScores = appState.quizScores?.filter(s => s >= 80) || [];
  if (highScores.length > 0) {
    fireMissionEvent("quiz_score_80", { score: 80 });
  }
  const perfectScores = appState.quizScores?.filter(s => s >= 100) || [];
  if (perfectScores.length > 0) {
    fireMissionEvent("quiz_score_100", { score: 100 });
  }

  // Check module completion missions
  if ((appState.completedModules?.length || 0) > 0) {
    const moduleMission = missionsData.find(m => m.triggerEvent === "module_complete" && !isMissionComplete(m.id));
    if (moduleMission) fireMissionEvent("module_complete");
  }

  if ((appState.completedModules?.length || 0) >= 6) {
    fireMissionEvent("all_modules_complete");
  }
}
