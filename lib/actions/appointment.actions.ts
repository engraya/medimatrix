import "server-only";
import { appointmentPageSchema, appointmentSchema, parseResponse, statsSchema } from "@/lib/api/schemas";
import { requireIdentity, requireStaff, serverApi } from "@/lib/api/server";
import { resourceId } from "@/lib/api/shared";
export async function getRecentAppointmentList(page = 1) {
  await requireStaff();
  const [rawList, rawStats] = await Promise.all([
    serverApi<unknown>(`/appointments?page=${page}&limit=20&sort=-createdAt`),
    serverApi<unknown>("/appointments/stats"),
  ]);
  const list = parseResponse(appointmentPageSchema, rawList);
  const stats = parseResponse(statsSchema, rawStats);
  return { ...stats, documents: list.items, totalCount: list.total };
}
export async function getAppointment(id: string) {
  await requireIdentity();
  return parseResponse(appointmentSchema, await serverApi<unknown>(`/appointments/${resourceId(id)}`));
}
