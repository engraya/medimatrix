"use client";
import { api } from "./client";
import { resourceId } from "./shared";
import { Doctor, Identity, Page, Patient, Notification, NotificationPreference } from "@/types/api";

type Search = { page?: number; limit?: number; q?: string; sort?: string };
function query(values: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined) params.set(key, String(value)); });
  return params.size ? `?${params}` : "";
}
const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

// Additional contract operations, available without provider SDKs.
export const usersApi = {
  me: () => api<Identity>("/users/me"),
  updateMe: (values: { name?: string; phone?: string }) => api<Identity>("/users/me", json("PATCH", values)),
  search: (values: Search & { role?: Identity["role"] } = {}) => api<Page<Identity>>(`/users${query(values)}`),
  invite: (values: { name: string; email: string; phone: string; role: "STAFF" | "ADMIN" }) => api<Identity>("/users/staff", json("POST", values)),
  changeRole: (id: string, role: "STAFF" | "ADMIN") => api<Identity>(`/users/${resourceId(id)}/role`, json("PATCH", { role })),
};
export const doctorsApi = {
  list: (page = 1) => api<Page<Doctor>>(`/doctors?active=true&page=${page}&limit=100`),
  get: (id: string) => api<Doctor>(`/doctors/${resourceId(id)}`),
  create: (values: Omit<Doctor, "id">) => api<Doctor>("/doctors", json("POST", values)),
  update: (id: string, values: Partial<Omit<Doctor, "id">>) => api<Doctor>(`/doctors/${resourceId(id)}`, json("PATCH", values)),
  deactivate: (id: string) => api<Doctor>(`/doctors/${resourceId(id)}`, { method: "DELETE" }),
};
export const patientsApi = {
  me: () => api<Patient>("/patients/me"),
  search: (values: Search = {}) => api<Page<Patient>>(`/patients${query(values)}`),
  get: (id: string) => api<Patient>(`/patients/${resourceId(id)}`),
  update: (id: string, values: { occupation?: string; allergies?: string }) => api<Patient>(`/patients/${resourceId(id)}`, json("PATCH", values)),
};
export const filesApi = {
  upload: (file: File) => {
    const body = new FormData(); body.append("file", file);
    return api<{ id: string }>("/files", { method: "POST", body });
  },
  url: (id: string) => api<{ id: string; url: string; expiresAt: string }>(`/files/${resourceId(id)}/url`),
};
export const notificationsApi = {
  inbox: (values: { page?: number; limit?: number; unread?: boolean } = {}) => api<Page<Notification> & { unreadCount: number }>(`/notifications${query(values)}`),
  preferences: () => api<NotificationPreference[]>("/notifications/preferences"),
  updatePreferences: (values: NotificationPreference[]) => api<NotificationPreference[]>("/notifications/preferences", json("PUT", values)),
  readAll: () => api<{ updated: number }>("/notifications/read-all", { method: "POST" }),
  read: (id: string) => api<{ id: string; readAt: string }>(`/notifications/${resourceId(id)}/read`, { method: "PATCH" }),
};
export const verificationApi = {
  startPhone: () => api<void>("/auth/phone/start", { method: "POST" }),
  verifyPhone: (code: string) => api<void>("/auth/phone/verify", json("POST", { code })),
};
