import Image from "next/image";
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
    <div className="flex h-screen max-h-screen">
      <section className="remove-scrollbar container my-auto">
        <div className="sub-container max-w-[760px] flex-1 justify-between">
          <Image
            src="/assets/icons/logo-full.svg"
            height={1000}
            width={1000}
            alt="logo"
            className="mb-12 justify-center items-center mx-auto h-20 w-fit"
          />

          <DoctorsProvider doctors={doctors}><AppointmentForm
            patientId={patient.id}
            userId={userId}
            type="create"
          /></DoctorsProvider>

          <p className="copyright mt-10 py-12 text-emerald-50">© 2024 MediMatrix | All Rights Reserved.</p>
        </div>
      </section>

      <Image
        src="/assets/images/side.jpg"
        height={1500}
        width={1500}
        alt="appointment"
        className="side-img max-w-[590px] bg-bottom"
      />
    </div>
  );
};

export default Appointment;
