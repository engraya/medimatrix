import { CareShell } from "@/components/CareShell";
import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { getPatient } from "@/lib/actions/patient.actions";
import { redirect } from "next/navigation";
import { getDoctors } from "@/lib/api/doctors";
import { DoctorsProvider } from "@/components/DoctorsProvider";

const Appointment = async ({ params }: SearchParamProps) => {
  const { userId } = await params;
  const patient = await getPatient(userId);
  if (!patient) redirect(`/patients/${userId}/register`);
  const doctors = await getDoctors();

  return (
    <CareShell image="/assets/images/side.jpg">
      <DoctorsProvider doctors={doctors}>
        <AppointmentForm patientId={patient.id} userId={userId} type="create" />
      </DoctorsProvider>
    </CareShell>
  );
};

export default Appointment;
