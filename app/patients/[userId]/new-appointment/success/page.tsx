import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import { requirePatient } from "@/lib/api/server";
import { ApiError } from "@/lib/api/shared";
import { getAppointment } from "@/lib/actions/appointment.actions";
import { formatDateTime } from "@/lib/utils";

const RequestSuccess = async ({ searchParams, params }: SearchParamProps) => {
  const { userId } = await params;
  await requirePatient(userId);
  const appointmentId = (await searchParams).appointmentId;
  if (
    typeof appointmentId !== "string" ||
    !/^[\w-]{1,128}$/.test(appointmentId)
  )
    notFound();
  let appointment;
  try {
    appointment = await getAppointment(appointmentId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <main id="main-content" className="mx-auto max-w-2xl px-6 py-16">
      <div className="form-section flex flex-col items-center gap-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 size={40} aria-hidden="true" />
        </div>
        <p className="eyebrow">REQUEST RECEIVED</p>
        <h1 className="header">You’ve taken the next step.</h1>
        <p className="text-muted-foreground">
          Your appointment request has been successfully submitted. Your care
          team will be in touch to confirm.
        </p>
        <dl className="w-full space-y-4 rounded-xl bg-background p-6 text-left">
          <div>
            <dt className="text-xs text-muted-foreground">Doctor</dt>
            <dd className="mt-1 font-medium">
              {appointment.doctor?.name ?? "Your selected doctor"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Requested time</dt>
            <dd className="mt-1 font-medium">
              {formatDateTime(appointment.schedule).dateTime}
            </dd>
          </div>
        </dl>
        <Button asChild>
          <Link href={`/patients/${userId}/new-appointment`}>
            Request another appointment
          </Link>
        </Button>
        <Link
          className="text-sm text-primary hover:underline"
          href={`/patients/${userId}/documents`}
        >
          Manage documents
        </Link>
      </div>
    </main>
  );
};
export default RequestSuccess;
