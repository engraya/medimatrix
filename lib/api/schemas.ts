import { z } from "zod";
import { ApiError } from "./shared";

// Validated against docs/sample-responses.json.
const id = z.string().regex(/^[\w-]{1,128}$/);
export const identitySchema = z.object({
  id, name: z.string(), email: z.string(), phone: z.string(),
  role: z.enum(["PATIENT", "STAFF", "ADMIN"]),
});
export const doctorSchema = z.object({
  id, name: z.string(), imageUrl: z.string().nullish().transform(value => value ?? undefined),
  specialty: z.string().nullish().transform(value => value ?? undefined), isActive: z.boolean(),
});
export const patientSchema = z.object({
  id, userId: id, name: z.string().optional(), user: identitySchema.optional(),
});
const patientRelationSchema = z.object({
  id, userId: id.optional(), name: z.string().optional(),
  user: z.object({ id, name: z.string(), email: z.string().optional() }).optional(),
});
export const appointmentSchema = z.object({
  id, patientId: id, patient: patientRelationSchema.optional(), userId: id.optional(),
  doctorId: id, doctor: doctorSchema.omit({ isActive: true }).optional(),
  schedule: z.string().refine(value => Number.isFinite(Date.parse(value))),
  status: z.enum(["PENDING", "SCHEDULED", "CANCELLED"]), reason: z.string(),
  note: z.string().nullish().transform(value => value ?? undefined),
  cancellationReason: z.string().nullish().transform(value => value ?? undefined),
});
export const appointmentPageSchema = z.object({ items: z.array(appointmentSchema), total: z.number().int().nonnegative() });
export const doctorListSchema = z.union([z.array(doctorSchema), z.object({ items: z.array(doctorSchema) }).transform(value => value.items)]);
export const statsSchema = z.object({
  total: z.number().int().nonnegative(), scheduled: z.number().int().nonnegative(), pending: z.number().int().nonnegative(), cancelled: z.number().int().nonnegative(),
}).transform(value => ({ scheduledCount: value.scheduled, pendingCount: value.pending, cancelledCount: value.cancelled }));
export const currentIdentitySchema = z.union([identitySchema, z.object({ user: identitySchema }).transform(value => value.user)]);
export function parseResponse<T extends z.ZodTypeAny>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success) throw new ApiError(502, "The service returned an unexpected response. Please contact support.");
  return result.data;
}
