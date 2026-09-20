import { z } from "zod";
const phone = z.string().regex(/^\+[1-9]\d{9,14}$/, "Enter a valid international phone number");
const name = z.string().trim().min(2, "Enter at least 2 characters").max(50);
export const UserFormValidation = z.object({ name, email: z.string().trim().email("Invalid email address"), phone });
const consent = z.boolean().refine(value => value, "Consent is required to proceed");
export const PatientFormValidation = z.object({
  birthDate: z.date({ required_error: "Enter your date of birth" }).refine(date => date <= new Date(), "Date of birth cannot be in the future"),
  gender: z.enum(["Male", "Female", "Other"]),
  address: z.string().trim().min(5).max(500),
  occupation: z.string().trim().min(2).max(500),
  emergencyContactName: name,
  emergencyContactNumber: phone,
  insuranceProvider: name,
  insurancePolicyNumber: z.string().trim().min(2).max(50),
  primaryDoctorId: z.string().optional(),
  allergies: z.string().trim().max(5000).optional(),
  currentMedication: z.string().trim().max(5000).optional(),
  familyMedicalHistory: z.string().trim().max(5000).optional(),
  pastMedicalHistory: z.string().trim().max(5000).optional(),
  treatmentConsent: consent,
  disclosureConsent: consent,
  privacyConsent: consent,
});
const futureDate = z.date().refine(date => date.getTime() > Date.now(), "Choose a future appointment time");
const doctorId = z.string().min(1, "Select a doctor");
const base = z.object({
  doctorId, schedule: futureDate,
  reason: z.string().trim().max(500).optional(),
  note: z.string().trim().max(2000).optional(),
  cancellationReason: z.string().trim().max(500).optional(),
});
export const CreateAppointmentSchema = base.extend({ reason: z.string().trim().min(2, "Enter a reason").max(500) });
export const ScheduleAppointmentSchema = base;
export const CancelAppointmentSchema = base.extend({
  doctorId: z.string(), schedule: z.date(),
  cancellationReason: z.string().trim().min(2, "Enter a cancellation reason").max(500),
});
export function getAppointmentSchema(type: string) {
  return type === "create" ? CreateAppointmentSchema : type === "cancel" ? CancelAppointmentSchema : ScheduleAppointmentSchema;
}
