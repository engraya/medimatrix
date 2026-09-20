import "server-only";
import { parseResponse, patientSchema } from "@/lib/api/schemas";
import { requirePatient, serverApi } from "@/lib/api/server";
import { ApiError } from "@/lib/api/shared";
export const getUser = requirePatient;
export async function getPatient(userId: string) {
  await requirePatient(userId);
  try { return parseResponse(patientSchema, await serverApi<unknown>("/patients/me")); }
  catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
