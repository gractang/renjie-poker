export function formatCategory(category) {
  return category.replaceAll("-", " ");
}

export function formatPercent(value) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

export function formatDate(value) {
  if (!value) return "not yet";
  return new Date(value).toLocaleString();
}
