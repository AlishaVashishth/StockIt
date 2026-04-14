export function getCompletedItems() {
  return JSON.parse(localStorage.getItem("completedItems") || "[]");
}

export function markItemComplete(itemId) {
  const completed = getCompletedItems();
  if (!completed.includes(itemId)) {
    completed.push(itemId);
    localStorage.setItem("completedItems", JSON.stringify(completed));
  }
}

export function isItemComplete(itemId) {
  return getCompletedItems().includes(itemId);
}

export function isModuleComplete(module) {
  const completed = getCompletedItems();
  return module.lessons.every(lesson => completed.includes(lesson.id));
}

export function getNextIncompleteItem(courseData) {
  const completed = getCompletedItems();
  for (const module of courseData) {
    for (const lesson of module.lessons) {
      if (!completed.includes(lesson.id)) {
        return { module, lesson };
      }
    }
  }
  return null;
}

export function isCourseComplete(courseData) {
  return getNextIncompleteItem(courseData) === null;
}

export function resetProgress() {
  localStorage.removeItem("completedItems");
}
