import { getScopedJson, setScopedItem } from "./userScopedStorage";

export function getRecentActivity() {
  return getScopedJson("recentActivity", []);
}

export function addRecentActivity(text) {
  const activity = getRecentActivity();
  activity.unshift({ text, date: new Date().toISOString() });
  setScopedItem("recentActivity", JSON.stringify(activity.slice(0, 20)));
}

export function removeRecentActivityByText(textPrefix) {
  const filtered = getRecentActivity().filter((item) => !String(item?.text || "").startsWith(textPrefix));
  setScopedItem("recentActivity", JSON.stringify(filtered));
}
