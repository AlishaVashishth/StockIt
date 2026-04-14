export function getRecentActivity() {
  return JSON.parse(localStorage.getItem("recentActivity") || "[]");
}

export function addRecentActivity(text) {
  const activity = getRecentActivity();
  activity.unshift({ text, date: new Date().toISOString() });
  localStorage.setItem("recentActivity", JSON.stringify(activity.slice(0, 20)));
}

export function removeRecentActivityByText(textPrefix) {
  const filtered = getRecentActivity().filter((item) => !String(item?.text || "").startsWith(textPrefix));
  localStorage.setItem("recentActivity", JSON.stringify(filtered));
}
