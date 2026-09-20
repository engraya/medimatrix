export interface Identity {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "PATIENT" | "STAFF" | "ADMIN";
}
export interface Doctor {
  id: string;
  name: string;
  imageUrl?: string;
  specialty?: string;
  isActive: boolean;
}
export interface Patient {
  id: string;
  userId: string;
  name?: string;
  user?: Identity;
}
export interface Appointment {
  id: string;
  patientId: string;
  patient?: { id: string; userId?: string; name?: string; user?: { id: string; name: string; email?: string } };
  userId?: string;
  doctorId: string;
  doctor?: Omit<Doctor, "isActive">;
  schedule: string;
  status: "PENDING" | "SCHEDULED" | "CANCELLED";
  reason: string;
  note?: string;
  cancellationReason?: string;
}
export interface Page<T> { items: T[]; total: number; page: number; limit: number; totalPages: number; }
export interface NotificationPreference { type: string; channel: "IN_APP" | "EMAIL" | "SMS"; enabled: boolean; }
export interface Notification { id: string; type: string; title: string; body: string; readAt: string | null; createdAt: string; }
export interface AppointmentStats {
  scheduledCount: number;
  pendingCount: number;
  cancelledCount: number;
}
