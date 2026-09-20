import Image from "next/image";
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
    <div className="flex h-screen max-h-screen">
      <section className="remove-scrollbar container">
        <div className="sub-container max-w-[900px] flex-1 flex-col py-10">
          <Image
            src="/assets/icons/logo-full.svg"
            height={1000}
            width={1000}
            alt="patient"
            className="mb-12 justify-center items-center mx-auto h-20 w-fit"
          />

          <DoctorsProvider doctors={doctors}><RegisterForm user={user} /></DoctorsProvider>

          <p className="copyright py-12">© 2024 MediMatrix | All Rights Reserved.</p>
        </div>
      </section>

      <Image
        src="/assets/images/register-img.jpg"
        height={1000}
        width={1000}
        alt="patient"
        className="side-img max-w-[550px]"
      />
    </div>
  );
};

export default Register;
