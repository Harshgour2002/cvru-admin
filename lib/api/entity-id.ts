export function getEntityId(entity: unknown): number | null {
  if (!entity || typeof entity !== "object") return null;

  const record = entity as Record<string, unknown>;
  const candidates = [
    record.id,
    record.newsId,
    record.newsLatestId,
    record.eventId,
    record.courseId,
    record.sportId,
  ];

  for (const value of candidates) {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }

  return null;
}
