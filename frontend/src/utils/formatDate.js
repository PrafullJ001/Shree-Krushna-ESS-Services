export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });