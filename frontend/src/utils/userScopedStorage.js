const USER_EMAIL_STORAGE_KEY = "investsim_user_email";

function getUserScope() {
  const email = (localStorage.getItem(USER_EMAIL_STORAGE_KEY) || "").trim().toLowerCase();
  return email || "guest";
}

export function scopedKey(baseKey) {
  return `${baseKey}::${getUserScope()}`;
}

export function getScopedItem(baseKey) {
  return localStorage.getItem(scopedKey(baseKey));
}

export function setScopedItem(baseKey, value) {
  localStorage.setItem(scopedKey(baseKey), value);
}

export function removeScopedItem(baseKey) {
  localStorage.removeItem(scopedKey(baseKey));
}

export function getScopedJson(baseKey, fallback) {
  try {
    const raw = getScopedItem(baseKey);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function migrateLegacyKeysForCurrentUser() {
  const email = (localStorage.getItem(USER_EMAIL_STORAGE_KEY) || "").trim().toLowerCase();
  if (!email) return;

  const migrationFlag = `scoped_migrated_v1::${email}`;
  if (localStorage.getItem(migrationFlag) === "1") return;

  const keysToMigrate = [
    "completedItems",
    "totalXP",
    "xpHistory",
    "recentActivity",
    "completedMissions",
    "missionProgress",
    "currentMissionBatch",
    "quizScores",
    "completedModules",
    "honor_mission_cleanup_v1_done",
  ];

  for (const baseKey of keysToMigrate) {
    const scoped = scopedKey(baseKey);
    const scopedVal = localStorage.getItem(scoped);
    if (scopedVal !== null) continue;
    const legacyVal = localStorage.getItem(baseKey);
    if (legacyVal !== null) {
      localStorage.setItem(scoped, legacyVal);
    }
  }

  localStorage.setItem(migrationFlag, "1");
}
