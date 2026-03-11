import { ZodSchema } from "zod";

export function zodResolver<T>(schema: ZodSchema<T>) {
  return (values: T) => {
    const parsed = schema.safeParse(values);
    if (parsed.success) return { values: parsed.data, errors: {} };

    const errors: Record<string, { message: string }> = {};
    parsed.error.issues.forEach((issue) => {
      const key = String(issue.path[0] || "form");
      errors[key] = { message: issue.message };
    });

    return { values, errors };
  };
}
