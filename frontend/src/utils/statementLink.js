export const buildStatementLink = (farmer) => {
  const slug = (farmer.fullName || "farmer")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${window.location.origin}/statement/${slug}-${farmer._id}`;
};