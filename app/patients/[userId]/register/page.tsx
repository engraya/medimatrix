import { CareShell } from "@/components/CareShell";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/forms/RegisterForm";
import { getPatient, getUser } from "@/lib/actions/patient.actions";
import { DoctorsProvider } from "@/components/DoctorsProvider";
import { getDoctors } from "@/lib/api/doctors";

const Register = async ({ params }: SearchParamProps) => {
  const { userId } = await params;
  const user = await getUser(userId);
  const patient = await getPatient(userId);

  if (patient) redirect(`/patients/${userId}/new-appointment`);
  const doctors = await getDoctors();

  return (
    <CareShell image="/assets/images/register-img.jpg" wide>
      <DoctorsProvider doctors={doctors}>
        <RegisterForm user={user} />
      </DoctorsProvider>
    </CareShell>
  );
};

export default Register;
