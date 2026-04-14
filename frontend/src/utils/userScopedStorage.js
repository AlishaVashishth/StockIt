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
