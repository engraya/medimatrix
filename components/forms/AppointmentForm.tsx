"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SelectItem } from "@/components/ui/select";
import { useDoctors } from "@/components/DoctorsProvider";
import { api } from "@/lib/api/client";
import { errorMessage, resourceId } from "@/lib/api/shared";
import { getAppointmentSchema } from "@/lib/validation";
import { Appointment } from "@/types/api";
import CustomFormField, { FormFieldType } from "../CustomFormField";
import SubmitButton from "../SubmitButton";
import { Form } from "../ui/form";
import "react-datepicker/dist/react-datepicker.css";

export function AppointmentForm({
  userId,
  type = "create",
  appointment,
  setOpen,
}: {
  userId?: string;
  patientId?: string;
  type: "create" | "schedule" | "cancel";
  appointment?: Appointment;
  setOpen?: Dispatch<SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const doctors = useDoctors();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [initialSchedule] = useState(() =>
    appointment
      ? new Date(appointment.schedule)
      : new Date(Date.now() + 3600_000),
  );
  const schema = getAppointmentSchema(type);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      doctorId: appointment?.doctorId ?? "",
      schedule: initialSchedule,
      reason: appointment?.reason ?? "",
      note: appointment?.note ?? "",
      cancellationReason: "",
    },
  });
  async function submit(values: z.infer<typeof schema>) {
    setBusy(true);
    setError("");
    try {
      const payload =
        type === "cancel"
          ? { cancellationReason: values.cancellationReason }
          : {
              doctorId: values.doctorId,
              schedule: values.schedule.toISOString(),
              note: values.note,
              ...(type === "create" ? { reason: values.reason } : {}),
            };
      if (type === "create") {
        const result = await api<Appointment>("/appointments", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        router.push(
          `/patients/${resourceId(userId ?? "")}/new-appointment/success?appointmentId=${resourceId(result.id)}`,
        );
      } else {
        await api(
          `/appointments/${resourceId(appointment?.id ?? "")}/${type}`,
          { method: "PATCH", body: JSON.stringify(payload) },
        );
        setOpen?.(false);
      }
      router.refresh();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="flex-1 space-y-6">
        {type === "create" && (
          <section className="mb-8 space-y-3">
            <p className="eyebrow">YOUR NEXT STEP</p>
            <h1 className="header">Make time for your health.</h1>
            <p className="text-muted-foreground leading-7">
              Choose your doctor and a preferred time. Your care team will
              confirm your appointment.
            </p>
          </section>
        )}
        {type !== "cancel" && (
          <>
            <CustomFormField
              fieldType={FormFieldType.SELECT}
              control={form.control}
              name="doctorId"
              label="Doctor"
              placeholder="Select a doctor"
            >
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.name}
                  {doctor.specialty ? ` — ${doctor.specialty}` : ""}
                </SelectItem>
              ))}
            </CustomFormField>
            {!doctors.length && (
              <p role="status">
                No doctors are available. Please try again later.
              </p>
            )}
            <CustomFormField
              fieldType={FormFieldType.DATE_PICKER}
              control={form.control}
              name="schedule"
              label="Expected Appointment Date (your local time)"
              showTimeSelect
              dateFormat="MM/dd/yyyy - h:mm aa"
            />
            {type === "create" && (
              <CustomFormField
                fieldType={FormFieldType.TEXTAREA}
                control={form.control}
                name="reason"
                label="Appointment Reason"
              />
            )}
            <CustomFormField
              fieldType={FormFieldType.TEXTAREA}
              control={form.control}
              name="note"
              label="Comments/notes"
            />
          </>
        )}
        {type === "cancel" && (
          <CustomFormField
            fieldType={FormFieldType.TEXTAREA}
            control={form.control}
            name="cancellationReason"
            label="Reason for Cancellation"
          />
        )}
        {error && (
          <p role="alert" className="shad-error">
            {error}
          </p>
        )}
        <SubmitButton
          isLoading={busy}
          disabled={type !== "cancel" && !doctors.length}
          className={`${type === "cancel" ? "shad-danger-btn" : "shad-primary-btn"} w-full`}
        >
          {type === "create"
            ? "Submit Appointment"
            : type === "schedule"
              ? "Schedule Appointment"
              : "Cancel Appointment"}
        </SubmitButton>
      </form>
    </Form>
  );
}
